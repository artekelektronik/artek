import { z } from "zod";
import { UserError } from "./errors";
import { requirePermission } from "./guard";
import { postDocument } from "./ledger";

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
  const parsed = stockOutInput.safeParse(input);
  if (!parsed.success) throw new UserError(parsed.error.issues[0].message);
  const { type, lokasyonId, reason, reference, lines, idempotencyKey } = parsed.data;
  const actor = await requirePermission(headers, "stock.out", lokasyonId);

  return postDocument(
    { kind: "stok_cikisi", lokasyonId, reason, reference: reference || null, userId: actor.userId, idempotencyKey },
    lines.map((line) => ({ ...line, lokasyonId, direction: "out" as const, type, reason })),
  );
}
