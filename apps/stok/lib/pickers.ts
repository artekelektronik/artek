import { asc, isNull } from "drizzle-orm";
import { db } from "../db";
import { product } from "../db/schema";
import { listLokasyon } from "./lokasyon";
import { can, type Action, type Actor } from "./permissions";

// Lokasyon this user may record the action at, for form dropdowns. The action still checks on the server.
export async function lokasyonFor(actor: Actor, action: Action) {
  return (await listLokasyon()).filter((l) => can(actor, action, l.id));
}

export function activeProducts() {
  return db
    .select({ id: product.id, code: product.code, name: product.name, unit: product.unit })
    .from(product)
    .where(isNull(product.archivedAt))
    .orderBy(asc(product.code));
}
