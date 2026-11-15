import { asc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "../db";
import { product, productComponent, productLabor, productPrice } from "../db/schema";
import { logActivity } from "./activity";
import { displayDecimal } from "./decimal";
import { UserError } from "./errors";
import { getRates } from "./exchange-rates";
import { requirePermission } from "./guard";
import { parsePrice } from "./stock-value";

// Everything the Fiyat hesapla screen works from: products with today's Alış fiyatı, each reçete and saved işçilik.
export async function quoteOptions(headers: Headers) {
  await requirePermission(headers, "finance.view");
  const [products, prices, recipeRows, laborRows, rates] = await Promise.all([
    db.select({ id: product.id, code: product.code, name: product.name, unit: product.unit }).from(product).where(isNull(product.archivedAt)).orderBy(asc(product.name)),
    db.select({ productId: productPrice.productId, price: productPrice.purchasePrice, currency: productPrice.purchaseCurrency }).from(productPrice).where(isNotNull(productPrice.purchasePrice)),
    db.select().from(productComponent),
    db.select({ productId: productLabor.productId, cost: productLabor.cost }).from(productLabor),
    getRates(),
  ]);
  const purchase = new Map(prices.map((p) => [p.productId, p]));
  const recipes: Record<string, { productId: string; quantity: string }[]> = {};
  for (const r of recipeRows) (recipes[r.productId] ??= []).push({ productId: r.componentId, quantity: displayDecimal(r.quantity) });
  return {
    products: products.map((p) => ({ ...p, price: purchase.get(p.id)?.price ?? null, currency: purchase.get(p.id)?.currency ?? null })),
    recipes,
    labor: Object.fromEntries(laborRows.map((l) => [l.productId, displayDecimal(l.cost)])),
    rates,
  };
}

// One unit's işçilik in TL for a product; empty removes it.
export async function saveLabor(headers: Headers, productId: string, raw: string) {
  const actor = await requirePermission(headers, "finance.edit");
  const [found] = await db.select({ code: product.code, name: product.name }).from(product).where(eq(product.id, productId));
  if (!found) throw new UserError("Ürün bulunamadı.");
  let cost: string | null;
  try {
    cost = parsePrice(raw);
  } catch {
    throw new UserError("İşçilik sıfırdan büyük bir sayı olmalı; yoksa boş bırakın.");
  }
  await db.transaction(async (tx) => {
    const [old] = await tx.select({ cost: productLabor.cost }).from(productLabor).where(eq(productLabor.productId, productId));
    if ((old ? Number(old.cost) : null) === (cost ? Number(cost) : null)) return;
    if (cost) {
      const values = { cost, updatedBy: actor.userId, updatedAt: new Date() };
      await tx.insert(productLabor).values({ productId, ...values }).onConflictDoUpdate({ target: productLabor.productId, set: values });
    } else {
      await tx.delete(productLabor).where(eq(productLabor.productId, productId));
    }
    const text = (v: string | null | undefined) => (v ? `${displayDecimal(v)} TL` : "—");
    await logActivity(tx, {
      entity: "fiyat",
      entityId: productId,
      label: `${found.code} ${found.name}`,
      action: old ? "duzenlendi" : "eklendi",
      detail: `İşçilik: ${text(old?.cost)} → ${text(cost)}`,
      userId: actor.userId,
    });
  });
}
