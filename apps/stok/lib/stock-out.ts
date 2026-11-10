import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { lokasyon, product, stock, stockDocument, stockMovement } from "../db/schema";
import { isUuid, parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";
import { postDocument, postDocumentIn, reversalLine, reverseMovement } from "./ledger";
import { addQuantities, formatQuantity, subtractQuantity, unitLabels } from "./quantity";
import { stockOutTypes } from "./stock-out-types";

const stockOutInput = z.object({
  type: z.enum(stockOutTypes, { error: "Çıkış türü seçin." }),
  lokasyonId: z.uuid({ error: "Lokasyon seçin." }),
  reason: z.string().trim().min(1, { error: "Çıkış için bir neden yazın." }),
  reference: z.string().trim().nullish(),
  lines: z
    .array(z.object({ productId: z.string(), quantity: z.string() }))
    .min(1, { error: "En az bir ürün satırı girin." }),
  idempotencyKey: z.string().min(1),
});

export type StockOutInput = z.input<typeof stockOutInput>;

export async function recordStockOut(headers: Headers, input: StockOutInput) {
  const data = parseInput(stockOutInput, input);
  const { type, lokasyonId, reason, reference, lines, idempotencyKey } = data;
  const actor = await requirePermission(headers, "stock.out", lokasyonId);

  const posted = await postDocument(
    { kind: "stok_cikisi", lokasyonId, reason, reference: reference || null, userId: actor.userId, idempotencyKey },
    lines.map((line) => ({ ...line, lokasyonId, direction: "out" as const, type, reason })),
  );
  return { ...posted, lines: await balancesAfter(posted.documentId) };
}

const correctionInput = stockOutInput.pick({ type: true, reason: true, reference: true, idempotencyKey: true }).extend({ quantity: z.string().trim().min(1, { error: "Miktarı yazın." }) });
export type StockOutCorrection = z.input<typeof correctionInput>;

// A retry of a correction that already went through returns that result.
async function alreadyDone(idempotencyKey: string) {
  const done = await db.query.stockDocument.findFirst({ where: eq(stockDocument.idempotencyKey, idempotencyKey) });
  return done ? { documentId: done.id, created: false } : null;
}

// A hand-made stock-out not yet reversed; a Fatura's own stock is corrected from the invoice.
async function correctable(headers: Headers, movementId: string) {
  await requirePermission(headers, "stock.reverse");
  const [row] = isUuid(movementId)
    ? await db
        .select({ movement: stockMovement, kind: stockDocument.kind })
        .from(stockMovement)
        .innerJoin(stockDocument, eq(stockDocument.id, stockMovement.documentId))
        .where(eq(stockMovement.id, movementId))
    : [];
  if (!row) throw new UserError("Hareket bulunamadı.");
  if (row.kind !== "stok_cikisi" || row.movement.reversesId) throw new UserError("Burada yalnız elle girilen stok çıkışı düzenlenip silinebilir.");
  if (await db.query.stockMovement.findFirst({ where: eq(stockMovement.reversesId, movementId) })) throw new UserError("Bu çıkış zaten düzeltilmiş.");
  return row.movement;
}

// Düzenle: the wrong movement is reversed and the right one recorded, together or not at all.
export async function correctStockOut(headers: Headers, movementId: string, input: StockOutCorrection) {
  const data = parseInput(correctionInput, input);
  const done = await alreadyDone(data.idempotencyKey);
  if (done) return done;
  const original = await correctable(headers, movementId);
  const actor = await requirePermission(headers, "stock.out", original.lokasyonId!);
  return db.transaction(async (tx) => {
    await postDocumentIn(tx, { kind: "ters_kayit", lokasyonId: original.lokasyonId, reason: `Düzeltildi: ${data.reason}`, userId: actor.userId, idempotencyKey: `${data.idempotencyKey}:ters` }, [
      reversalLine(original, `Düzeltildi: ${data.reason}`),
    ]);
    return postDocumentIn(
      tx,
      { kind: "stok_cikisi", lokasyonId: original.lokasyonId, reason: data.reason, reference: data.reference || null, userId: actor.userId, idempotencyKey: data.idempotencyKey },
      [{ productId: original.productId, lokasyonId: original.lokasyonId, direction: "out", quantity: data.quantity, type: data.type, reason: data.reason }],
    );
  });
}

// Sil: reversed, so the stock comes back; both rows stay in the history.
export async function deleteStockOut(headers: Headers, movementId: string, { idempotencyKey }: { idempotencyKey: string }) {
  const done = await alreadyDone(idempotencyKey);
  if (done) return done;
  await correctable(headers, movementId);
  return reverseMovement(headers, movementId, { reason: "Stok çıkışı silindi", idempotencyKey });
}

// Each product of a stock-out with its balance before and after, so the person saving it sees it was taken off.
async function balancesAfter(documentId: string) {
  const moved = await db
    .select({
      code: product.code,
      name: product.name,
      unit: product.unit,
      lokasyonName: lokasyon.name,
      quantity: stockMovement.quantity,
      after: stock.physical,
    })
    .from(stockMovement)
    .innerJoin(product, eq(product.id, stockMovement.productId))
    .innerJoin(lokasyon, eq(lokasyon.id, stockMovement.lokasyonId))
    .innerJoin(stock, and(eq(stock.productId, stockMovement.productId), eq(stock.lokasyonId, stockMovement.lokasyonId)))
    .where(eq(stockMovement.documentId, documentId));

  const byProduct = new Map<string, Omit<(typeof moved)[number], "quantity"> & { taken: string }>();
  for (const { quantity, ...line } of moved) {
    byProduct.set(line.code, { ...line, taken: addQuantities(byProduct.get(line.code)?.taken ?? "0", quantity) });
  }
  return [...byProduct.values()].map(({ taken, after, ...line }) => ({
    ...line,
    before: subtractQuantity(after, taken),
    after: formatQuantity(after),
  }));
}

type StockOutLine = Awaited<ReturnType<typeof balancesAfter>>[number];

export const stockOutLineText = (l: StockOutLine) =>
  `${l.code} ${l.name}: ${l.before.replace(".", ",")} → ${l.after.replace(".", ",")} ${unitLabels[l.unit]} (${l.lokasyonName})`;
