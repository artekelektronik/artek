import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db";
import { countKind, lokasyon, product, productShelf, stock, stockCount, stockCountLine, user } from "../db/schema";
import { isUniqueViolation, UserError } from "./errors";
import { loadActor, requirePermission } from "./guard";
import { postDocument, visibleLokasyonIds, type MovementLine } from "./ledger";
import { can } from "./permissions";
import { formatQuantity, parseQuantity, subtractQuantity, type Unit } from "./quantity";

export type CountKind = (typeof countKind.enumValues)[number];

async function findCount(countId: string) {
  const found = z.uuid().safeParse(countId).success
    ? await db.query.stockCount.findFirst({ where: eq(stockCount.id, countId) })
    : undefined;
  if (!found) throw new UserError("Sayım bulunamadı.");
  return found;
}

// A count line may be zero: the product is simply not there.
function parseCounted(raw: string, unit: Unit) {
  if (/^0+([.,]0*)?$/.test(raw.trim())) return { ok: true as const, value: "0" };
  return parseQuantity(raw, unit);
}

export async function openCount(
  headers: Headers,
  { lokasyonId, kind, category }: { lokasyonId: string; kind: CountKind; category?: string | null },
) {
  if (!z.uuid().safeParse(lokasyonId).success) throw new UserError("Lokasyon seçin.");
  const actor = await requirePermission(headers, "count.perform", lokasyonId);
  const place = await db.query.lokasyon.findFirst({ where: eq(lokasyon.id, lokasyonId) });
  if (kind === "acilis" && place?.openedAt) throw new UserError("Bu Lokasyonun açılış sayımı zaten onaylandı.");
  if (kind === "sayim" && !place?.openedAt) throw new UserError("Önce bu Lokasyonun açılış sayımı onaylanmalı.");

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(stockCount)
      .values({ lokasyonId, kind, category: category || null, createdBy: actor.userId })
      .returning({ id: stockCount.id });
    const products = await tx
      .select({ id: product.id, rafKodu: productShelf.rafKodu })
      .from(product)
      .leftJoin(productShelf, and(eq(productShelf.productId, product.id), eq(productShelf.lokasyonId, lokasyonId)))
      .where(and(isNull(product.archivedAt), category ? eq(product.category, category) : undefined));
    if (products.length === 0) throw new UserError("Sayılacak aktif ürün yok.");
    await tx
      .insert(stockCountLine)
      .values(products.map((p) => ({ countId: created.id, productId: p.id, rafKodu: p.rafKodu })));
    return { countId: created.id };
  });
}

// Saves counted quantities. Each line keeps the balance at the moment it was counted,
// so later sales and transfers don't distort its difference. Empty entries are left uncounted.
export async function recordCountLines(headers: Headers, countId: string, entries: { productId: string; counted: string }[]) {
  const count = await findCount(countId);
  const actor = await requirePermission(headers, "count.perform", count.lokasyonId);

  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(stockCount).where(eq(stockCount.id, countId)).for("share");
    if (current.status !== "taslak") throw new UserError("Bu sayım açık değil; satır kaydedilemez.");
    for (const entry of entries.filter((e) => e.counted.trim() !== "")) {
      const [line] = await tx
        .select({ code: product.code, unit: product.unit })
        .from(stockCountLine)
        .innerJoin(product, eq(product.id, stockCountLine.productId))
        .where(and(eq(stockCountLine.countId, countId), eq(stockCountLine.productId, entry.productId)));
      if (!line) throw new UserError("Bu ürün sayım listesinde yok.");
      const counted = parseCounted(entry.counted, line.unit);
      if (!counted.ok) throw new UserError(`${line.code}: ${counted.error}`);
      const balance = await tx.query.stock.findFirst({
        where: and(eq(stock.productId, entry.productId), eq(stock.lokasyonId, count.lokasyonId)),
      });
      await tx
        .update(stockCountLine)
        .set({
          counted: counted.value,
          balanceAtCount: balance?.physical ?? "0",
          countedAt: new Date(),
          countedBy: actor.userId,
        })
        .where(and(eq(stockCountLine.countId, countId), eq(stockCountLine.productId, entry.productId)));
    }
  });
}

// Applies each counted line exactly once: a Sayım as its difference (sayım düzeltmesi), an
// Açılış sayımı as the opening balance (açılış), which also opens the Lokasyon for other movements.
export async function approveCount(headers: Headers, countId: string, { idempotencyKey }: { idempotencyKey: string }) {
  const count = await findCount(countId);
  const actor = await requirePermission(headers, "count.approve", count.lokasyonId);
  const opening = count.kind === "acilis";

  try {
    return await postDocument(
      { kind: opening ? "acilis" : "sayim", lokasyonId: count.lokasyonId, userId: actor.userId, idempotencyKey },
      async (tx, documentId) => {
        const [current] = await tx.select().from(stockCount).where(eq(stockCount.id, countId)).for("update");
        if (current.status === "onaylandi") throw new UserError("Bu sayım zaten onaylandı.");
        if (current.status === "iptal") throw new UserError("İptal edilen sayım onaylanamaz.");

        const lines = await tx
          .select()
          .from(stockCountLine)
          .where(and(eq(stockCountLine.countId, countId), isNotNull(stockCountLine.counted)));
        const movements: MovementLine[] = [];
        for (const line of lines) {
          // Before go-live every balance is zero, so the opening movement is the counted quantity.
          const difference = opening ? formatQuantity(line.counted!) : subtractQuantity(line.counted!, line.balanceAtCount!);
          if (difference === "0") continue;
          movements.push({
            productId: line.productId,
            lokasyonId: count.lokasyonId,
            direction: difference.startsWith("-") ? "out" : "in",
            quantity: difference.replace("-", ""),
            type: opening ? "acilis" : "sayim_duzeltmesi",
            reason: opening ? "Açılış sayımı" : "Sayım farkı",
          });
        }
        await tx
          .update(stockCount)
          .set({ status: "onaylandi", approvedBy: actor.userId, approvedAt: new Date(), approveDocumentId: documentId })
          .where(eq(stockCount.id, countId));
        if (opening) await tx.update(lokasyon).set({ openedAt: new Date() }).where(eq(lokasyon.id, count.lokasyonId));
        return movements;
      },
    );
  } catch (error) {
    if (isUniqueViolation(error, "one_opening_per_lokasyon")) {
      throw new UserError("Bu Lokasyonun açılış sayımı zaten onaylandı.");
    }
    throw error;
  }
}

// An abandoned session is closed without touching stock.
export async function cancelCount(headers: Headers, countId: string) {
  const count = await findCount(countId);
  const actor = await requirePermission(headers, "count.approve", count.lokasyonId);
  const [cancelled] = await db
    .update(stockCount)
    .set({ status: "iptal", cancelledBy: actor.userId, cancelledAt: new Date() })
    .where(and(eq(stockCount.id, countId), eq(stockCount.status, "taslak")))
    .returning({ id: stockCount.id });
  if (!cancelled) throw new UserError("Yalnızca açık bir sayım iptal edilebilir.");
}

const creator = alias(user, "creator");
const approver = alias(user, "approver");
const counter = alias(user, "counter");

export async function getCount(headers: Headers, countId: string) {
  const actor = await loadActor(headers);
  if (!z.uuid().safeParse(countId).success) return undefined;
  const [found] = await db
    .select({
      id: stockCount.id,
      lokasyonId: stockCount.lokasyonId,
      lokasyonName: lokasyon.name,
      kind: stockCount.kind,
      status: stockCount.status,
      category: stockCount.category,
      createdAt: stockCount.createdAt,
      createdById: stockCount.createdBy,
      createdBy: creator.name,
      approvedAt: stockCount.approvedAt,
      approvedById: stockCount.approvedBy,
      approvedBy: approver.name,
      cancelledAt: stockCount.cancelledAt,
    })
    .from(stockCount)
    .innerJoin(lokasyon, eq(lokasyon.id, stockCount.lokasyonId))
    .innerJoin(creator, eq(creator.id, stockCount.createdBy))
    .leftJoin(approver, eq(approver.id, stockCount.approvedBy))
    .where(eq(stockCount.id, countId));
  if (!found || !can(actor, "stock.view", found.lokasyonId)) return undefined;

  const lines = await db
    .select({
      productId: stockCountLine.productId,
      code: product.code,
      name: product.name,
      unit: product.unit,
      rafKodu: stockCountLine.rafKodu,
      counted: stockCountLine.counted,
      balanceAtCount: stockCountLine.balanceAtCount,
      countedAt: stockCountLine.countedAt,
      countedById: stockCountLine.countedBy,
      countedBy: counter.name,
    })
    .from(stockCountLine)
    .innerJoin(product, eq(product.id, stockCountLine.productId))
    .leftJoin(counter, eq(counter.id, stockCountLine.countedBy))
    .where(eq(stockCountLine.countId, countId))
    .orderBy(sql`${stockCountLine.rafKodu} asc nulls last`, asc(product.code));

  return {
    ...found,
    lines: lines.map((l) => ({
      ...l,
      counted: l.counted === null ? null : formatQuantity(l.counted),
      balanceAtCount: l.balanceAtCount === null ? null : formatQuantity(l.balanceAtCount),
      difference: l.counted === null ? null : subtractQuantity(l.counted, l.balanceAtCount!),
    })),
  };
}

export async function listCounts(headers: Headers) {
  const visible = await visibleLokasyonIds(await loadActor(headers));
  return db
    .select({
      id: stockCount.id,
      kind: stockCount.kind,
      status: stockCount.status,
      category: stockCount.category,
      lokasyonName: lokasyon.name,
      createdAt: stockCount.createdAt,
      createdBy: creator.name,
    })
    .from(stockCount)
    .innerJoin(lokasyon, eq(lokasyon.id, stockCount.lokasyonId))
    .innerJoin(creator, eq(creator.id, stockCount.createdBy))
    .where(visible ? inArray(stockCount.lokasyonId, visible) : undefined)
    .orderBy(sql`${stockCount.status} <> 'taslak'`, desc(stockCount.createdAt))
    .limit(200);
}
