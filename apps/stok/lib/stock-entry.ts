import { and, count as countRows, desc, asc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, type Tx } from "../db";
import { lokasyon, product, productShelf, stock, stockCount, stockCountLine } from "../db/schema";
import { approveCount, recordCountLines } from "./counts";
import { postDocument } from "./ledger";
import { parseInput, UserError } from "./errors";
import { loadActor, requirePermission } from "./guard";
import { listLokasyon } from "./lokasyon";
import { can } from "./permissions";
import { formatQuantity, parseQuantityOrZero, subtractQuantity } from "./quantity";

// Stok girişi: one sheet across Lokasyon. Quantities go on each Lokasyon's open count, whose approval posts them:
// an Açılış sayımı until the Lokasyon is open, and additions to the balance after that.

const draftKind = (place: { openedAt: Date | null }) => (place.openedAt ? "sayim" : "acilis");

function findDraft(tx: typeof db | Tx, place: { id: string; openedAt: Date | null }) {
  return tx.query.stockCount.findFirst({
    where: and(
      eq(stockCount.lokasyonId, place.id),
      eq(stockCount.kind, draftKind(place)),
      eq(stockCount.status, "taslak"),
      eq(stockCount.addsToStock, place.openedAt !== null),
      isNull(stockCount.category),
    ),
    orderBy: desc(stockCount.createdAt),
  });
}

export async function getStockEntrySheet(headers: Headers) {
  const actor = await loadActor(headers);
  const places = (await listLokasyon()).filter((l) => can(actor, "count.perform", l.id));
  if (places.length === 0) return { lokasyon: [], rows: [] };
  const placeIds = places.map((l) => l.id);

  const drafts = new Map(await Promise.all(places.map(async (l) => [l.id, await findDraft(db, l)] as const)));
  const draftIds = [...drafts.values()].flatMap((d) => (d ? [d.id] : []));
  const [lines, piles, approved, products] = await Promise.all([
    draftIds.length ? db.select().from(stockCountLine).where(inArray(stockCountLine.countId, draftIds)) : [],
    db.select().from(stock).where(inArray(stock.lokasyonId, placeIds)),
    db
      .select({ lokasyonId: stockCount.lokasyonId, total: countRows() })
      .from(stockCount)
      .where(and(inArray(stockCount.lokasyonId, placeIds), eq(stockCount.status, "onaylandi")))
      .groupBy(stockCount.lokasyonId),
    db
      .select({
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        manufacturerCode: product.manufacturerCode,
        images: product.images,
        unit: product.unit,
        isMaterial: product.isMaterial,
        isTradeGoods: product.isTradeGoods,
      })
      .from(product)
      .where(isNull(product.archivedAt))
      .orderBy(asc(product.code)),
  ]);

  const entered = new Map(lines.filter((l) => l.counted !== null).map((l) => [`${l.countId}:${l.productId}`, formatQuantity(l.counted!)]));
  const current = new Map(piles.map((p) => [`${p.lokasyonId}:${p.productId}`, formatQuantity(p.physical)]));

  return {
    lokasyon: places.map((l) => {
      const draft = drafts.get(l.id);
      return {
        id: l.id,
        name: l.name,
        opened: l.openedAt !== null,
        canApprove: can(actor, "count.approve", l.id),
        canCorrect: l.openedAt !== null && can(actor, "stock.correct", l.id),
        pending: draft ? lines.filter((line) => line.countId === draft.id && line.counted !== null).length : 0,
        // Changes when an approval empties the sheet, so the page can start its inputs afresh.
        round: approved.find((a) => a.lokasyonId === l.id)?.total ?? 0,
      };
    }),
    rows: products.map((p) => ({
      ...p,
      cells: Object.fromEntries(
        places.map((l) => {
          const draft = drafts.get(l.id);
          return [
            l.id,
            {
              current: current.get(`${l.id}:${p.id}`) ?? "0",
              entered: draft ? (entered.get(`${draft.id}:${p.id}`) ?? null) : null,
            },
          ];
        }),
      ),
    })),
  };
}

export type StockEntrySheet = Awaited<ReturnType<typeof getStockEntrySheet>>;

const entryInput = z.object({
  productId: z.uuid({ error: "Ürün bulunamadı." }),
  lokasyonId: z.uuid({ error: "Lokasyon bulunamadı." }),
  counted: z.string(),
});

// An empty quantity takes the entry back.
export async function saveStockEntry(headers: Headers, input: z.input<typeof entryInput>) {
  const { productId, lokasyonId, counted } = parseInput(entryInput, input);
  const actor = await requirePermission(headers, "count.perform", lokasyonId);

  const countId = await db.transaction(async (tx) => {
    // Locked so two quick entries at a Lokasyon share one draft.
    const [place] = await tx.select().from(lokasyon).where(eq(lokasyon.id, lokasyonId)).for("update");
    if (!place) throw new UserError("Lokasyon bulunamadı.");
    const active = await tx.query.product.findFirst({ where: and(eq(product.id, productId), isNull(product.archivedAt)) });
    if (!active) throw new UserError("Ürün bulunamadı.");

    const draft = await findDraft(tx, place);
    const id =
      draft?.id ??
      (await tx.insert(stockCount).values({ lokasyonId, kind: draftKind(place), addsToStock: place.openedAt !== null, createdBy: actor.userId }).returning({ id: stockCount.id }))[0].id;
    const shelf = await tx.query.productShelf.findFirst({
      where: and(eq(productShelf.productId, productId), eq(productShelf.lokasyonId, lokasyonId)),
    });
    await tx.insert(stockCountLine).values({ countId: id, productId, rafKodu: shelf?.rafKodu }).onConflictDoNothing();
    return id;
  });

  await recordCountLines(headers, countId, [{ productId, counted }]);
}

export async function approveStockEntries(headers: Headers, lokasyonId: string, { idempotencyKey }: { idempotencyKey: string }) {
  await requirePermission(headers, "count.approve", lokasyonId);
  const place = await db.query.lokasyon.findFirst({ where: eq(lokasyon.id, lokasyonId) });
  if (!place) throw new UserError("Lokasyon bulunamadı.");
  const draft = await findDraft(db, place);
  const hasEntries =
    draft &&
    (await db.query.stockCountLine.findFirst({
      where: and(eq(stockCountLine.countId, draft.id), isNotNull(stockCountLine.counted)),
    }));
  if (!hasEntries) throw new UserError("Onaylanacak giriş yok.");
  return approveCount(headers, draft.id, { idempotencyKey });
}

const correctionInput = z.object({
  productId: z.uuid({ error: "Ürün bulunamadı." }),
  lokasyonId: z.uuid({ error: "Lokasyon bulunamadı." }),
  quantity: z.string().trim().min(1, { error: "Doğru sayıyı yazın." }),
  idempotencyKey: z.string().min(1),
});

// Sets a wrongly entered balance to the right number at once. Like any stock change it is a movement, so it stays on record.
export async function correctStock(headers: Headers, input: z.input<typeof correctionInput>) {
  const { productId, lokasyonId, quantity, idempotencyKey } = parseInput(correctionInput, input);
  const actor = await requirePermission(headers, "stock.correct", lokasyonId);
  const found = await db.query.product.findFirst({ where: eq(product.id, productId), columns: { code: true, unit: true } });
  if (!found) throw new UserError("Ürün bulunamadı.");
  const parsed = parseQuantityOrZero(quantity, found.unit);
  if (!parsed.ok) throw new UserError(parsed.error);

  return postDocument({ kind: "sayim", lokasyonId, reason: "Stok düzenleme", userId: actor.userId, idempotencyKey }, async (tx) => {
    const [pile] = await tx
      .select()
      .from(stock)
      .where(and(eq(stock.productId, productId), eq(stock.lokasyonId, lokasyonId)))
      .for("update");
    const difference = subtractQuantity(parsed.value, pile?.physical ?? "0");
    if (difference === "0") return [];
    return [
      {
        productId,
        lokasyonId,
        direction: difference.startsWith("-") ? ("out" as const) : ("in" as const),
        quantity: difference.replace("-", ""),
        type: "sayim_duzeltmesi" as const,
        reason: "Stok düzenleme",
      },
    ];
  });
}
