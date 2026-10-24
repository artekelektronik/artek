import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, type Tx } from "../db";
import { product, productShelf, stockCount, stockCountLine, stockMovement, transfer, transferLine, unit } from "../db/schema";
import { isUniqueViolation, isUuid, parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";
import { deleteUnusedImages } from "./product-image-files";
import { parseQuantity } from "./quantity";

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullish();

const productInput = z
  .object({
    code: z.string().trim().min(1, "Ürün kodu gerekli."),
    name: z.string().trim().min(1, "Ürün adı gerekli."),
    category: z.string().trim().min(1, "Kategori gerekli."),
    isTradeGoods: z.boolean(),
    isMaterial: z.boolean(),
    unit: z.enum(unit.enumValues, { error: "Birim seçin." }),
    showOnSite: z.boolean(),
    productType: optionalText,
    subCategory: optionalText,
    manufacturer: optionalText,
    manufacturerCode: optionalText,
    supplier: optionalText,
    supplierCountry: optionalText,
    minLevel: z.string().trim().nullish(),
    description: optionalText,
    images: z.array(z.string().trim().min(1)).default([]),
    datasheets: z.array(z.object({ label: z.string().trim().min(1), url: z.string().trim().min(1) })).default([]),
    // Raf kodu by Lokasyon id; an empty code removes it.
    shelves: z.record(z.uuid(), z.string().trim(), { error: "Raf kodu bilinmeyen bir Lokasyon için girildi." }).default({}),
  })
  .refine((p) => p.isTradeGoods || p.isMaterial, { error: "Ürün Ticari mal veya Malzeme (ya da ikisi) olmalı." });

export type ProductInput = z.input<typeof productInput>;

function parse(input: ProductInput) {
  const { minLevel, ...fields } = parseInput(productInput, input);
  // Kritik seviye follows the product's unit, like any quantity; empty means no warning.
  if (!minLevel) return { ...fields, minLevel: null };
  const level = parseQuantity(minLevel, fields.unit);
  if (!level.ok) throw new UserError(`Kritik seviye: ${level.error}`);
  return { ...fields, minLevel: level.value };
}

async function saveWith<T>(write: () => Promise<T>) {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error, "product_code_unique")) throw new UserError("Bu ürün kodu zaten kullanılıyor.");
    throw error;
  }
}

async function replaceShelves(tx: Tx, productId: string, shelves: Record<string, string>) {
  await tx.delete(productShelf).where(eq(productShelf.productId, productId));
  const rows = Object.entries(shelves)
    .filter(([, rafKodu]) => rafKodu)
    .map(([lokasyonId, rafKodu]) => ({ productId, lokasyonId, rafKodu }));
  if (rows.length) await tx.insert(productShelf).values(rows);
}

export async function createProduct(headers: Headers, input: ProductInput) {
  await requirePermission(headers, "products.manage");
  const { shelves, ...fields } = parse(input);
  return saveWith(() =>
    db.transaction(async (tx) => {
      const [created] = await tx.insert(product).values(fields).returning();
      await replaceShelves(tx, created.id, shelves);
      return created;
    }),
  );
}

export async function updateProduct(headers: Headers, id: string, input: ProductInput) {
  await requirePermission(headers, "products.manage");
  const { shelves, ...fields } = parse(input);
  const before = await db.query.product.findFirst({ where: eq(product.id, id), columns: { images: true } });
  await saveWith(() =>
    db.transaction(async (tx) => {
      // One unit per product, no conversions: once stock has moved, the unit is fixed.
      const current = await tx.query.product.findFirst({ where: eq(product.id, id), columns: { unit: true } });
      if (current && current.unit !== fields.unit) {
        const moved = await tx.query.stockMovement.findFirst({ where: eq(stockMovement.productId, id), columns: { id: true } });
        if (moved) throw new UserError("Hareketi olan ürünün birimi değiştirilemez.");
      }
      await tx.update(product).set({ ...fields, updatedAt: new Date() }).where(eq(product.id, id));
      await replaceShelves(tx, id, shelves);
    }),
  );
  await deleteUnusedImages((before?.images ?? []).filter((url) => !fields.images.includes(url)));
}

export async function setShowOnSite(headers: Headers, id: string, showOnSite: boolean) {
  await requirePermission(headers, "products.manage");
  await db.update(product).set({ showOnSite, updatedAt: new Date() }).where(eq(product.id, id));
}

// Products are never deleted: archiving hides them from everyday lists and keeps their history.
export async function archiveProduct(headers: Headers, id: string) {
  await requirePermission(headers, "products.manage");
  // Archived products take no new movements, so documents still in progress must finish first.
  const [onTheWay] = await db
    .select({ id: transferLine.transferId })
    .from(transferLine)
    .innerJoin(transfer, eq(transfer.id, transferLine.transferId))
    .where(and(eq(transferLine.productId, id), eq(transfer.status, "yolda")))
    .limit(1);
  if (onTheWay) throw new UserError("Bu ürün yolda olan bir transferde; teslim alınmadan arşivlenemez.");
  const [inCount] = await db
    .select({ id: stockCountLine.countId })
    .from(stockCountLine)
    .innerJoin(stockCount, eq(stockCount.id, stockCountLine.countId))
    .where(and(eq(stockCountLine.productId, id), eq(stockCount.status, "taslak")))
    .limit(1);
  if (inCount) throw new UserError("Bu ürün açık bir sayımda; sayım kapanmadan arşivlenemez.");
  await db.update(product).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(product.id, id));
}

export async function restoreProduct(headers: Headers, id: string) {
  await requirePermission(headers, "products.manage");
  await db.update(product).set({ archivedAt: null, updatedAt: new Date() }).where(eq(product.id, id));
}

export async function listProducts(headers: Headers, filters: { archived?: boolean }) {
  await requirePermission(headers, "products.view");
  return db
    .select()
    .from(product)
    .where(filters.archived ? isNotNull(product.archivedAt) : isNull(product.archivedAt))
    .orderBy(asc(product.code));
}

export async function listCategories(headers: Headers) {
  await requirePermission(headers, "products.view");
  const rows = await db.selectDistinct({ category: product.category }).from(product).orderBy(asc(product.category));
  return rows.map((r) => r.category);
}

export async function getProduct(headers: Headers, id: string) {
  await requirePermission(headers, "products.view");
  if (!isUuid(id)) return undefined;
  const found = await db.query.product.findFirst({ where: eq(product.id, id) });
  if (!found) return undefined;
  const shelves = await db.select().from(productShelf).where(eq(productShelf.productId, id));
  return { ...found, shelves: Object.fromEntries(shelves.map((s) => [s.lokasyonId, s.rafKodu])) };
}
