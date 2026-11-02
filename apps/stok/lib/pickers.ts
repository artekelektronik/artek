import { asc, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import { product, stock } from "../db/schema";
import { listLokasyon } from "./lokasyon";
import { can, type Action, type Actor } from "./permissions";
import { subtractQuantity } from "./quantity";

// Lokasyon this user may record the action at, for form dropdowns. The action still checks on the server.
export async function lokasyonFor(actor: Actor, action: Action) {
  return (await listLokasyon()).filter((l) => can(actor, action, l.id));
}

export function activeProducts() {
  return db
    .select({
      id: product.id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      category: product.category,
      manufacturerCode: product.manufacturerCode,
      productType: product.productType,
    })
    .from(product)
    .where(isNull(product.archivedAt))
    .orderBy(asc(product.code));
}

// What can be taken right now: Lokasyon id → product id → available quantity. Only pass Lokasyon the user may act at.
export async function availableByLokasyon(lokasyonIds: string[]) {
  const piles = await db.select().from(stock).where(inArray(stock.lokasyonId, lokasyonIds));
  const result: Record<string, Record<string, string>> = {};
  for (const pile of piles) {
    (result[pile.lokasyonId] ??= {})[pile.productId] = subtractQuantity(pile.physical, pile.reserved);
  }
  return result;
}
