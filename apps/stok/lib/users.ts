import { eq } from "drizzle-orm";
import { db, type Tx } from "../db";
import { user, userLokasyon, userRole } from "../db/schema";
import { auth } from "./auth";
import type { Role } from "./permissions";

export type NewUser = {
  email: string;
  name: string;
  password?: string; // invited users set theirs from an emailed link
  roles: Role[];
  lokasyonIds?: string[];
};

// The only way to create a user (sign-up is disabled); `alsoInTransaction` shares the transaction.
export async function createUser(
  { email, name, password, roles, lokasyonIds = [] }: NewUser,
  alsoInTransaction?: (tx: Tx, userId: string) => Promise<void>,
) {
  const ctx = await auth.$context;
  const { minPasswordLength } = ctx.password.config;
  if (password !== undefined && password.length < minPasswordLength) {
    throw new Error(`Şifre en az ${minPasswordLength} karakter olmalı.`);
  }

  const created = await ctx.internalAdapter.createUser(
    { email: email.trim().toLowerCase(), name, emailVerified: true },
    { method: "email-password" },
  );
  try {
    if (password !== undefined) {
      const hash = await ctx.password.hash(password);
      await ctx.internalAdapter.linkAccount({ userId: created.id, providerId: "credential", accountId: created.id, password: hash });
    }
    await db.transaction(async (tx) => {
      await writeAccess(tx, created.id, { roles, lokasyonIds });
      await alsoInTransaction?.(tx, created.id);
    });
  } catch (error) {
    // Better Auth writes outside our transaction; undo the half-made user so a retry can succeed.
    await db.delete(user).where(eq(user.id, created.id));
    throw error;
  }
  return created;
}

export async function writeAccess(tx: Tx, id: string, { roles, lokasyonIds }: { roles: Role[]; lokasyonIds: string[] }) {
  if (roles.length) await tx.insert(userRole).values(roles.map((role) => ({ userId: id, role })));
  if (lokasyonIds.length) await tx.insert(userLokasyon).values(lokasyonIds.map((lokasyonId) => ({ userId: id, lokasyonId })));
}
