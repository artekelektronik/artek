import { eq } from "drizzle-orm";
import { db } from "../db";
import { userLokasyon, userRole } from "../db/schema";
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

// The signed-in user with their roles and Lokasyon, read from the database, never from the request.
export async function loadActor(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) throw new NotSignedIn();

  const userId = session.user.id;
  const [roles, lokasyon] = await Promise.all([
    db.select({ role: userRole.role }).from(userRole).where(eq(userRole.userId, userId)),
    db.select({ id: userLokasyon.lokasyonId }).from(userLokasyon).where(eq(userLokasyon.userId, userId)),
  ]);
  return { userId, roles: roles.map((r) => r.role), lokasyonIds: lokasyon.map((l) => l.id) };
}

// The one server-side check every action runs before touching data.
export async function requirePermission(headers: Headers, action: Action, lokasyonId?: string) {
  const actor = await loadActor(headers);
  if (!can(actor, action, lokasyonId)) throw new Forbidden();
  return actor;
}
