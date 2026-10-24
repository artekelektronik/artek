import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db";
import * as schema from "../db/schema";

// Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL from the environment.
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // Invite-only: users are created by an admin (or the first-admin script), never by signing up.
  emailAndPassword: { enabled: true, disableSignUp: true },
  // Applies to requests through /api/auth (on in production); kept in the database because
  // each serverless instance would otherwise count attempts separately.
  rateLimit: { storage: "database" },
  plugins: [nextCookies()],
});
