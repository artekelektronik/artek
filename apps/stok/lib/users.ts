import { eq } from "drizzle-orm";
import { db } from "../db";
import { user, userLokasyon, userRole } from "../db/schema";
import { auth } from "./auth";
import type { Role } from "./permissions";

export type NewUser = {
  email: string;
  name: string;
  password: string;
  roles: Role[];
  lokasyonIds?: string[];
};

// Creates a user with an email + password login, the way Better Auth's own sign-up would,
// plus their roles and Lokasyon. Sign-up itself is disabled, so this is the only way in.
export async function createUser({ email, name, password, roles, lokasyonIds = [] }: NewUser) {
  const ctx = await auth.$context;
  const { minPasswordLength } = ctx.password.config;
  if (password.length < minPasswordLength) throw new Error(`Şifre en az ${minPasswordLength} karakter olmalı.`);

  const hash = await ctx.password.hash(password);
  const created = await ctx.internalAdapter.createUser(
    { email: email.trim().toLowerCase(), name, emailVerified: true },
    { method: "email-password" },
  );
  try {
    await ctx.internalAdapter.linkAccount({
      userId: created.id,
      providerId: "credential",
      accountId: created.id,
      password: hash,
    });
    if (roles.length) await db.insert(userRole).values(roles.map((role) => ({ userId: created.id, role })));
    if (lokasyonIds.length) {
      await db.insert(userLokasyon).values(lokasyonIds.map((lokasyonId) => ({ userId: created.id, lokasyonId })));
    }
  } catch (error) {
    // Better Auth writes outside our transactions; undo the half-made user so a retry can succeed.
    await db.delete(user).where(eq(user.id, created.id));
    throw error;
  }
  return created;
}
