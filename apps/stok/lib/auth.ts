import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { resendSender } from "./email";
import { passwordEmail } from "./password-email";

// Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL from the environment.
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // Invite-only: users are created by an admin (or the first-admin script), never by signing up.
  // Invited users set their password through Better Auth's reset-password flow (lib/user-admin.ts).
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    revokeSessionsOnPasswordReset: true,
    // "Şifremi unuttum": Better Auth answers the same whether or not the email exists and rate-limits
    // the request; a deactivated user gets nothing.
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, token }) => {
      const [row] = await db
        .select({ deactivatedAt: schema.user.deactivatedAt })
        .from(schema.user)
        .where(eq(schema.user.id, user.id));
      if (!row || row.deactivatedAt) return;
      await resendSender(passwordEmail(user, "reset", token));
      await db
        .insert(schema.auditLog)
        .values({ actorId: user.id, targetUserId: user.id, action: "user.password_link", after: { kind: "reset", self: true } });
    },
    onPasswordReset: async ({ user }) => {
      await db.insert(schema.auditLog).values({ actorId: user.id, targetUserId: user.id, action: "user.password_set" });
    },
  },
  // Applies to requests through /api/auth (on in production); kept in the database because
  // each serverless instance would otherwise count attempts separately.
  rateLimit: { storage: "database" },
  databaseHooks: {
    session: {
      create: {
        // A deactivated user can't sign in: returning false makes sign-in fail.
        before: async (session) => {
          const [row] = await db
            .select({ deactivatedAt: schema.user.deactivatedAt })
            .from(schema.user)
            .where(eq(schema.user.id, session.userId));
          if (row?.deactivatedAt) return false;
        },
      },
    },
  },
  plugins: [nextCookies()],
});
