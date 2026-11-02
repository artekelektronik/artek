import { asc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { logActivity } from "./activity";
import { currency, product, productPrice } from "../db/schema";
import { parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";
import { getOverview } from "./overview";
import { parsePrice, type Price } from "./stock-value";

// Unchecked: for callers that already checked finance.view.
export async function loadPrices() {
  const rows = await db.select().from(productPrice);
  return new Map<string, Price>(rows.map((r) => [r.productId, r]));
}

// Every active product with its stock and prices, for the Fiyatlar screen.
export async function listPrices(headers: Headers) {
  await requirePermission(headers, "finance.view");
  const [overview, prices] = await Promise.all([getOverview(headers, {}), loadPrices()]);
  return { rows: overview.rows, lokasyon: overview.lokasyon, prices };
}

const priceLines = z.array(
  z.object({
    productId: z.uuid(),
    purchasePrice: z.string(),
    purchaseCurrency: z.enum(currency.enumValues),
    salePrice: z.string(),
    saleCurrency: z.enum(currency.enumValues),
  }),
);

const money = (price: string | null | undefined, currency: string) => (price ? `${String(Number(price)).replace(".", ",")} ${currency === "TRY" ? "TL" : currency}` : "—");

// "Alış: — → 12,5 USD; Satış: 30 TL → 35 TL", naming only the side that changed.
function priceChanges(old: Price | undefined, next: { purchasePrice: string | null; purchaseCurrency: string; salePrice: string | null; saleCurrency: string }) {
  const sides = [
    ["Alış", money(old?.purchasePrice, old?.purchaseCurrency ?? ""), money(next.purchasePrice, next.purchaseCurrency)],
    ["Satış", money(old?.salePrice, old?.saleCurrency ?? ""), money(next.salePrice, next.saleCurrency)],
  ];
  return sides.filter(([, before, after]) => before !== after).map(([side, before, after]) => `${side}: ${before} → ${after}`).join("; ");
}

const same = (a: string | null | undefined, b: string | null) => (a ? Number(a) : null) === (b ? Number(b) : null);

// Saves the lines that changed, so "who changed it" stays true for the rest. Both prices empty removes the row.
export async function savePrices(headers: Headers, input: z.input<typeof priceLines>) {
  const actor = await requirePermission(headers, "finance.edit");
  const lines = parseInput(priceLines, input);
  const products = await db.select({ id: product.id, code: product.code, name: product.name }).from(product).where(isNull(product.archivedAt)).orderBy(asc(product.code));
  const known = new Map(products.map((p) => [p.id, p]));

  const parsed = lines.flatMap((line) => {
    const found = known.get(line.productId);
    if (!found) return [];
    try {
      return [{ ...line, purchasePrice: parsePrice(line.purchasePrice), salePrice: parsePrice(line.salePrice) }];
    } catch (error) {
      throw new UserError(`${found.code}: ${(error as Error).message}`);
    }
  });

  await db.transaction(async (tx) => {
    const current = await tx.select().from(productPrice).where(inArray(productPrice.productId, parsed.map((p) => p.productId)));
    const before = new Map(current.map((c) => [c.productId, c]));
    for (const { productId, ...price } of parsed) {
      const old = before.get(productId);
      const { code, name } = known.get(productId)!;
      const log = (detail: string) =>
        detail ? logActivity(tx, { entity: "fiyat", entityId: productId, label: `${code} ${name}`, action: old ? "duzenlendi" : "eklendi", detail, userId: actor.userId }) : undefined;
      if (!price.purchasePrice && !price.salePrice) {
        if (old) {
          await tx.delete(productPrice).where(eq(productPrice.productId, productId));
          await log(priceChanges(old, price));
        }
        continue;
      }
      const unchanged =
        old &&
        same(old.purchasePrice, price.purchasePrice) &&
        same(old.salePrice, price.salePrice) &&
        old.purchaseCurrency === price.purchaseCurrency &&
        old.saleCurrency === price.saleCurrency;
      if (unchanged) continue;
      const values = { ...price, updatedBy: actor.userId, updatedAt: new Date() };
      await tx.insert(productPrice).values({ productId, ...values }).onConflictDoUpdate({ target: productPrice.productId, set: values });
      await log(priceChanges(old, price));
    }
  });
}
