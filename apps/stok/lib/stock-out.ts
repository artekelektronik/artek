import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { lokasyon, product, stock, stockMovement } from "../db/schema";
import { parseInput } from "./errors";
import { requirePermission } from "./guard";
import { postDocument } from "./ledger";
import { addQuantities, formatQuantity, subtractQuantity, unitLabels } from "./quantity";

// Recorded by hand until Sipariş (Phase 3) and Üretim emri (Phase 4) create these movements themselves.
export const stockOutTypes = ["satis_teslimati", "uretim_tuketimi", "fire"] as const;

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
