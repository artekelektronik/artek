import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "../db";
import { user, userLokasyon, userRole } from "../db/schema";
import { auth } from "./auth";
import { can, type Action } from "./permissions";

export class NotSignedIn extends Error {
  constructor() {
    super("Oturum açmanız gerekiyor.");
  }
}

export class Forbidden extends Error {
  constructor() {
    super("Bu işlem için yetkiniz yok.");
  }
}

// The signed-in user with roles and Lokasyon from the database, loaded once per server render.
export async function loadActor(headers: Headers) {
  return actorFor(headers.get("cookie") ?? "");
}

const actorFor = cache(async (cookie: string) => {
  const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
  if (!session) throw new NotSignedIn();

  const userId = session.user.id;
  const [roles, lokasyon, [account]] = await Promise.all([
    db.select({ role: userRole.role }).from(userRole).where(eq(userRole.userId, userId)),
    db.select({ id: userLokasyon.lokasyonId }).from(userLokasyon).where(eq(userLokasyon.userId, userId)),
    db.select({ deactivatedAt: user.deactivatedAt }).from(user).where(eq(user.id, userId)),
  ]);
  // Deactivation also deletes sessions; this covers any session that survives it.
  if (account?.deactivatedAt) throw new NotSignedIn();
  return {
    userId,
    name: session.user.name,
    email: session.user.email,
    roles: roles.map((r) => r.role),
    lokasyonIds: lokasyon.map((l) => l.id),
  };
});

// The one server-side check every action runs before touching data.
export async function requirePermission(headers: Headers, action: Action, lokasyonId?: string) {
  const actor = await loadActor(headers);
  if (!can(actor, action, lokasyonId)) throw new Forbidden();
  return actor;
}
