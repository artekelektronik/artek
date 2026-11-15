import { asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { appSetting, product, productComponent, productLabor, productPrice, quote } from "../db/schema";
import { logActivity } from "./activity";
import { decimalText, displayDecimal, normalizeDecimal } from "./decimal";
import { parseInput, UserError } from "./errors";
import { getRates } from "./exchange-rates";
import { requirePermission } from "./guard";
import type { ProductLabor } from "./quote-calc";

const hourlyRateKey = "saat_ucreti";

// Unchecked: for callers that already checked finance.view. The Saat ücreti (0 until typed) and each product's usual labour.
export async function loadLabor() {
  const [[rate], rows] = await Promise.all([
    db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, hourlyRateKey)),
    db.select({ productId: productLabor.productId, minutes: productLabor.minutes, cost: productLabor.cost }).from(productLabor),
  ]);
  return { rate: Number(rate?.value ?? 0), byProduct: new Map<string, ProductLabor>(rows.map((r) => [r.productId, r])) };
}

// Everything the Fiyat hesapla screen works from: products with today's Alış fiyatı, each reçete, labour and saved çalışmalar.
export async function quoteOptions(headers: Headers) {
  await requirePermission(headers, "finance.view");
  const [products, prices, recipeRows, labor, rates, quotes] = await Promise.all([
    db.select({ id: product.id, code: product.code, name: product.name, unit: product.unit }).from(product).where(isNull(product.archivedAt)).orderBy(asc(product.name)),
    db.select({ productId: productPrice.productId, price: productPrice.purchasePrice, currency: productPrice.purchaseCurrency }).from(productPrice).where(isNotNull(productPrice.purchasePrice)),
    db.select().from(productComponent),
    loadLabor(),
    getRates(),
    db.select().from(quote).orderBy(desc(quote.updatedAt)),
  ]);
  const purchase = new Map(prices.map((p) => [p.productId, p]));
  const recipes: Record<string, { productId: string; quantity: string }[]> = {};
  for (const r of recipeRows) (recipes[r.productId] ??= []).push({ productId: r.componentId, quantity: displayDecimal(r.quantity) });
  return {
    products: products.map((p) => ({ ...p, price: purchase.get(p.id)?.price ?? null, currency: purchase.get(p.id)?.currency ?? null })),
    recipes,
    labor: Object.fromEntries(labor.byProduct),
    hourlyRate: labor.rate,
    rates,
    quotes: quotes.map((q) => ({
      id: q.id,
      title: q.title,
      customer: q.customer ?? "",
      productId: q.productId ?? "",
      quantity: displayDecimal(q.quantity),
      materials: q.materials.map((m) => ({ productId: m.productId, quantity: displayDecimal(m.quantity) })),
      laborMinutes: q.laborMinutes ? displayDecimal(q.laborMinutes) : "",
      profitPct: q.profitPct ? displayDecimal(q.profitPct) : null,
      unitPrice: q.unitPrice ? displayDecimal(q.unitPrice) : null,
      note: q.note ?? "",
      updatedOn: q.updatedAt.toISOString().slice(0, 10),
    })),
  };
}
export type QuoteOptions = Awaited<ReturnType<typeof quoteOptions>>;

const positive = (error: string) => decimalText(error).refine((v) => Number(v) > 0, { error });
const optionalNumber = (error: string) =>
  z
    .string()
    .trim()
    .transform((raw, ctx) => {
      if (!raw) return null;
      const value = normalizeDecimal(raw);
      if (value === null || Number(value) < 0) ctx.addIssue({ code: "custom", message: error });
      return value;
    });
const materialsInput = z.array(z.object({ productId: z.uuid(), quantity: positive("Malzeme miktarı sıfırdan büyük olmalı.") }));

const quoteInput = z.object({
  id: z.uuid().nullable(),
  title: z.string().trim().min(1, { error: "Çalışmaya bir ad verin." }),
  customer: z.string().trim(),
  productId: z.uuid().nullable(),
  quantity: positive("Adet sıfırdan büyük olmalı."),
  materials: materialsInput,
  laborMinutes: optionalNumber("Süre bir sayı olmalı."),
  profitPct: optionalNumber("Kâr oranı bir sayı olmalı."),
  unitPrice: optionalNumber("Satış fiyatı bir sayı olmalı."),
  note: z.string().trim(),
});
export type QuoteInput = z.input<typeof quoteInput>;

// Saves a Fiyat çalışması; with an id it is changed in place, without one a new one is made (a copy, too).
export async function saveQuote(headers: Headers, input: QuoteInput) {
  const actor = await requirePermission(headers, "finance.edit");
  const { id, ...data } = parseInput(quoteInput, input);
  const values = { ...data, customer: data.customer || null, note: data.note || null, updatedAt: new Date() };
  return db.transaction(async (tx) => {
    const [saved] = id
      ? await tx.update(quote).set(values).where(eq(quote.id, id)).returning({ id: quote.id })
      : await tx.insert(quote).values({ ...values, createdBy: actor.userId }).returning({ id: quote.id });
    if (!saved) throw new UserError("Çalışma bulunamadı; silinmiş olabilir.");
    await logActivity(tx, { entity: "fiyat", entityId: saved.id, label: `Fiyat çalışması: ${data.title}`, action: id ? "duzenlendi" : "eklendi", detail: data.customer || null, userId: actor.userId });
    return saved.id;
  });
}

export async function deleteQuote(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "finance.edit");
  await db.transaction(async (tx) => {
    const [gone] = await tx.delete(quote).where(eq(quote.id, id)).returning({ title: quote.title });
    if (gone) await logActivity(tx, { entity: "fiyat", entityId: id, label: `Fiyat çalışması: ${gone.title}`, action: "silindi", detail: null, userId: actor.userId });
  });
}

// The Saat ücreti: what an hour of production work costs, in TL. Every İşçilik follows it.
export async function saveHourlyRate(headers: Headers, raw: string) {
  const actor = await requirePermission(headers, "finance.edit");
  const value = normalizeDecimal(raw);
  if (value === null || Number(value) <= 0) throw new UserError("Saat ücreti sıfırdan büyük bir sayı olmalı.");
  await db.transaction(async (tx) => {
    const [old] = await tx.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, hourlyRateKey));
    if (old && Number(old.value) === Number(value)) return;
    const values = { value, updatedBy: actor.userId, updatedAt: new Date() };
    await tx.insert(appSetting).values({ key: hourlyRateKey, ...values }).onConflictDoUpdate({ target: appSetting.key, set: values });
    await logActivity(tx, {
      entity: "fiyat",
      entityId: "00000000-0000-0000-0000-000000000000", // a setting, not a row of its own
      label: "Saat ücreti",
      action: old ? "duzenlendi" : "eklendi",
      detail: `${old ? `${displayDecimal(old.value)} TL` : "—"} → ${displayDecimal(value)} TL`,
      userId: actor.userId,
    });
  });
}

const standardInput = z.object({ productId: z.uuid(), materials: materialsInput, laborMinutes: optionalNumber("Süre bir sayı olmalı.") });

// Makes these materials and minutes the product's usual ones: its Reçete and İşçilik, which the next invoice and çalışma start from.
export async function saveStandard(headers: Headers, input: z.input<typeof standardInput>) {
  const actor = await requirePermission(headers, "finance.edit");
  const data = parseInput(standardInput, input);
  const [found] = await db.select({ code: product.code, name: product.name }).from(product).where(eq(product.id, data.productId));
  if (!found) throw new UserError("Ürün bulunamadı.");
  if (new Set(data.materials.map((m) => m.productId)).size !== data.materials.length) throw new UserError("Aynı malzeme iki kez yazılmış; tek satırda toplayın.");
  await db.transaction(async (tx) => {
    await tx.delete(productComponent).where(eq(productComponent.productId, data.productId));
    if (data.materials.length) await tx.insert(productComponent).values(data.materials.map((m) => ({ productId: data.productId, componentId: m.productId, quantity: Number(m.quantity).toFixed(3) })));
    if (data.laborMinutes && Number(data.laborMinutes) > 0) {
      const values = { minutes: data.laborMinutes, cost: null, updatedBy: actor.userId, updatedAt: new Date() };
      await tx.insert(productLabor).values({ productId: data.productId, ...values }).onConflictDoUpdate({ target: productLabor.productId, set: values });
    } else {
      await tx.delete(productLabor).where(eq(productLabor.productId, data.productId));
    }
    await logActivity(tx, {
      entity: "fiyat",
      entityId: data.productId,
      label: `${found.code} ${found.name}`,
      action: "duzenlendi",
      detail: `Reçete: ${data.materials.length} malzeme; işçilik: ${data.laborMinutes ? `${displayDecimal(data.laborMinutes)} dk` : "—"}`,
      userId: actor.userId,
    });
  });
}
