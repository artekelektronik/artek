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
  // Invite-only; invited users set a password through the reset-password flow (lib/user-admin.ts).
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    revokeSessionsOnPasswordReset: true,
    // "Şifremi unuttum": rate-limited, same answer for every email, nothing for deactivated users.
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
  // In the database so every serverless instance shares the count.
  rateLimit: { storage: "database" },
  databaseHooks: {
    session: {
      create: {
        // Returning false blocks sign-in for deactivated users.
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
