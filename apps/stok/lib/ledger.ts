import { and, asc, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import { db, type Tx } from "../db";
import { documentKind, lokasyon, movementType, product, stock, stockDocument, stockMovement, user } from "../db/schema";
import { isUniqueViolation, isUuid, UserError } from "./errors";
import { queueMinimumLevelWarnings } from "./kritik-seviye";
import { loadActor, requirePermission } from "./guard";
import { can, type Actor } from "./permissions";
import { addQuantities, formatQuantity, parseQuantity, subtractQuantity, unitLabels } from "./quantity";

export type MovementType = (typeof movementType.enumValues)[number];

type NewDocument = {
  kind: (typeof documentKind.enumValues)[number];
  lokasyonId?: string | null;
  supplier?: string | null;
  reference?: string | null;
  reason?: string | null;
  userId: string;
  idempotencyKey: string;
};

export type MovementLine = {
  productId: string;
  lokasyonId: string | null; // null: on the way in a Transfer
  direction: "in" | "out";
  quantity: string; // as typed, checked against the product's unit inside the transaction
  type: MovementType;
  reason?: string | null;
  transferId?: string | null;
  reversesId?: string | null;
};

// One transaction; a repeated idempotency key returns the first document. `lines` may run inside it.
export async function postDocument(
  document: NewDocument,
  lines: MovementLine[] | ((tx: Tx, documentId: string) => Promise<MovementLine[]>),
) {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(stockDocument)
      .values(document)
      .onConflictDoNothing({ target: stockDocument.idempotencyKey })
      .returning({ id: stockDocument.id });
    if (!created) {
      const existing = await tx.query.stockDocument.findFirst({
        where: eq(stockDocument.idempotencyKey, document.idempotencyKey),
      });
      return { documentId: existing!.id, created: false };
    }

    const resolved = typeof lines === "function" ? await lines(tx, created.id) : lines;
    // A fixed order means two documents touching the same balances can't deadlock.
    const ordered = [...resolved].sort((a, b) =>
      `${a.productId}${a.lokasyonId}`.localeCompare(`${b.productId}${b.lokasyonId}`),
    );
    for (const line of ordered) await applyLine(tx, created.id, document.userId, line);
    await queueMinimumLevelWarnings(tx, created.id);
    return { documentId: created.id, created: true };
  });
}

async function applyLine(tx: Tx, documentId: string, userId: string, line: MovementLine) {
  if (!isUuid(line.productId)) throw new UserError("Ürün bulunamadı; listeden bir ürün seçin.");
  const found = await tx.query.product.findFirst({
    where: eq(product.id, line.productId),
    columns: { code: true, unit: true, archivedAt: true },
  });
  if (!found) throw new UserError("Ürün bulunamadı.");
  // Archived products keep their history; only a reversal of a past movement may still touch them.
  if (found.archivedAt && !line.reversesId) throw new UserError(`Arşivdeki ürün için hareket kaydedilemez: ${found.code}.`);
  // Go-live: a Lokasyon's balances start from its Açılış sayımı; nothing else is recorded before it.
  if (line.lokasyonId && line.type !== "acilis") {
    const place = await tx.query.lokasyon.findFirst({ where: eq(lokasyon.id, line.lokasyonId) });
    if (!place?.openedAt) throw new UserError(`${place?.name ?? "Lokasyon"} için açılış sayımı onaylanmadan hareket kaydedilemez.`);
  }
  const parsed = parseQuantity(line.quantity, found.unit);
  if (!parsed.ok) throw new UserError(`${found.code}: ${parsed.error}`);
  const signed = line.direction === "out" ? `-${parsed.value}` : parsed.value;

  if (line.lokasyonId) {
    if (line.direction === "in") {
      await tx
        .insert(stock)
        .values({ productId: line.productId, lokasyonId: line.lokasyonId, physical: parsed.value })
        .onConflictDoUpdate({
          target: [stock.productId, stock.lokasyonId],
          set: { physical: sql`${stock.physical} + ${parsed.value}::numeric` },
        });
    } else {
      // Takes stock only if enough is available; concurrent requests queue on the row lock.
      const [updated] = await tx
        .update(stock)
        .set({ physical: sql`${stock.physical} - ${parsed.value}::numeric` })
        .where(
          and(
            eq(stock.productId, line.productId),
            eq(stock.lokasyonId, line.lokasyonId),
            sql`${stock.physical} - ${parsed.value}::numeric >= ${stock.reserved}`,
          ),
        )
        .returning({ physical: stock.physical });
      if (!updated) {
        const current = await tx.query.stock.findFirst({
          where: and(eq(stock.productId, line.productId), eq(stock.lokasyonId, line.lokasyonId)),
        });
        const available = current ? subtractQuantity(current.physical, current.reserved) : "0";
        throw new UserError(`Yetersiz stok: ${found.code} için kullanılabilir miktar ${available} ${unitLabels[found.unit]}.`);
      }
    }
  }

  try {
    await tx.insert(stockMovement).values({
      documentId,
      productId: line.productId,
      lokasyonId: line.lokasyonId,
      transferId: line.transferId ?? null,
      type: line.type,
      quantity: signed,
      unit: found.unit,
      reason: line.reason ?? null,
      userId,
      reversesId: line.reversesId ?? null,
    });
  } catch (error) {
    if (isUniqueViolation(error, "stock_movement_reverses_id_unique")) {
      throw new UserError("Bu hareketin zaten ters kaydı var.");
    }
    throw error;
  }
}

// The Lokasyon whose stock this user may see; undefined means every Lokasyon (and stock on the way).
export async function visibleLokasyonIds(actor: Actor): Promise<string[] | undefined> {
  const all = await db.select({ id: lokasyon.id }).from(lokasyon);
  const visible = all.filter((l) => can(actor, "stock.view", l.id)).map((l) => l.id);
  return visible.length === all.length ? undefined : visible;
}

export async function getBalances(headers: Headers, productId: string) {
  const actor = await loadActor(headers);
  const visible = await visibleLokasyonIds(actor);
  const rows = await db
    .select({
      lokasyonId: lokasyon.id,
      name: lokasyon.name,
      physical: sql<string>`coalesce(${stock.physical}, 0)`,
      reserved: sql<string>`coalesce(${stock.reserved}, 0)`,
    })
    .from(lokasyon)
    .leftJoin(stock, and(eq(stock.lokasyonId, lokasyon.id), eq(stock.productId, productId)))
    .where(visible ? inArray(lokasyon.id, visible) : undefined)
    .orderBy(asc(lokasyon.name));

  const lines = rows.map((r) => ({
    lokasyonId: r.lokasyonId,
    name: r.name,
    physical: formatQuantity(r.physical),
    reserved: formatQuantity(r.reserved),
    available: subtractQuantity(r.physical, r.reserved),
  }));
  return {
    lokasyon: lines,
    // Totals cover the visible Lokasyon only; false when that isn't every Lokasyon.
    isCompanyTotal: visible === undefined,
    total: {
      physical: addQuantities(...lines.map((l) => l.physical)),
      reserved: addQuantities(...lines.map((l) => l.reserved)),
      available: addQuantities(...lines.map((l) => l.available)),
    },
  };
}

export const movementLimit = 500;

type MovementFilters = {
  productId?: string;
  lokasyonId?: string;
  userId?: string;
  type?: MovementType;
  from?: Date;
  to?: Date;
  limit?: number;
};

export async function listMovements(headers: Headers, filters: MovementFilters) {
  const actor = await loadActor(headers);
  const visible = await visibleLokasyonIds(actor);
  const conditions: (SQL | undefined)[] = [
    visible ? inArray(stockMovement.lokasyonId, visible) : undefined,
    filters.productId ? eq(stockMovement.productId, filters.productId) : undefined,
    filters.lokasyonId ? eq(stockMovement.lokasyonId, filters.lokasyonId) : undefined,
    filters.userId ? eq(stockMovement.userId, filters.userId) : undefined,
    filters.type ? eq(stockMovement.type, filters.type) : undefined,
    filters.from ? gte(stockMovement.createdAt, filters.from) : undefined,
    filters.to ? lte(stockMovement.createdAt, filters.to) : undefined,
  ];
  const rows = await db
    .select({
      id: stockMovement.id,
      createdAt: stockMovement.createdAt,
      type: stockMovement.type,
      quantity: stockMovement.quantity,
      unit: stockMovement.unit,
      reason: stockMovement.reason,
      reversesId: stockMovement.reversesId,
      transferId: stockMovement.transferId,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      lokasyonId: stockMovement.lokasyonId,
      lokasyonName: lokasyon.name,
      userId: stockMovement.userId,
      userName: user.name,
      documentId: stockDocument.id,
      documentKind: stockDocument.kind,
      reference: stockDocument.reference,
      supplier: stockDocument.supplier,
    })
    .from(stockMovement)
    .innerJoin(product, eq(product.id, stockMovement.productId))
    .innerJoin(user, eq(user.id, stockMovement.userId))
    .innerJoin(stockDocument, eq(stockDocument.id, stockMovement.documentId))
    .leftJoin(lokasyon, eq(lokasyon.id, stockMovement.lokasyonId))
    .where(and(...conditions))
    .orderBy(desc(stockMovement.createdAt), desc(stockMovement.id))
    .limit(filters.limit ?? movementLimit);
  return rows.map((r) => ({ ...r, quantity: formatQuantity(r.quantity) }));
}

export async function reverseMovement(
  headers: Headers,
  movementId: string,
  { reason, idempotencyKey }: { reason: string; idempotencyKey: string },
) {
  const actor = await requirePermission(headers, "stock.reverse");
  // A retry of a reversal that already went through returns that result.
  const done = await db.query.stockDocument.findFirst({ where: eq(stockDocument.idempotencyKey, idempotencyKey) });
  if (done) return { documentId: done.id, created: false };
  if (!reason.trim()) throw new UserError("Ters kayıt için bir neden yazın.");
  const original = await db.query.stockMovement.findFirst({ where: eq(stockMovement.id, movementId) });
  if (!original) throw new UserError("Hareket bulunamadı.");
  if (original.reversesId) throw new UserError("Bir ters kayıt yeniden ters kaydedilemez.");
  // Reversing one transfer movement alone would create or lose stock; send the stock back instead.
  if (original.transferId) throw new UserError("Transfer hareketleri ters kaydedilemez; ürünleri geri gönderin.");
  // Checked first for a clear message; the unique reverses_id still settles a race between two requests.
  if (await db.query.stockMovement.findFirst({ where: eq(stockMovement.reversesId, movementId) })) {
    throw new UserError("Bu hareketin zaten ters kaydı var.");
  }
  const quantity = formatQuantity(original.quantity);

  return postDocument(
    { kind: "ters_kayit", lokasyonId: original.lokasyonId, reason: reason.trim(), userId: actor.userId, idempotencyKey },
    [
      {
        productId: original.productId,
        lokasyonId: original.lokasyonId,
        direction: quantity.startsWith("-") ? "in" : "out",
        quantity: quantity.replace("-", ""),
        type: original.type,
        reason: reason.trim(),
        reversesId: original.id,
      },
    ],
  );
}

// Every stored balance compared with the sum of its movements. Empty means the ledger is consistent.
export async function findBalanceMismatches() {
  const { rows } = await db.execute<{ product_id: string; lokasyon_id: string; stored: string; from_movements: string }>(sql`
    with moved as (
      select product_id, lokasyon_id, sum(quantity) as total
      from stock_movement where lokasyon_id is not null
      group by product_id, lokasyon_id
    )
    select coalesce(s.product_id, m.product_id) as product_id,
           coalesce(s.lokasyon_id, m.lokasyon_id) as lokasyon_id,
           coalesce(s.physical, 0) as stored,
           coalesce(m.total, 0) as from_movements
    from stock s full outer join moved m on m.product_id = s.product_id and m.lokasyon_id = s.lokasyon_id
    where coalesce(s.physical, 0) <> coalesce(m.total, 0)
  `);
  return rows;
}
