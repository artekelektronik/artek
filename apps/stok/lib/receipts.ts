import { z } from "zod";
import { UserError } from "./errors";
import { requirePermission } from "./guard";
import { postDocument } from "./ledger";

const receiptInput = z.object({
  lokasyonId: z.uuid({ error: "Lokasyon seçin." }),
  supplier: z.string().trim().nullish(),
  reference: z.string().trim().nullish(),
  lines: z
    .array(z.object({ productId: z.string(), quantity: z.string() }))
    .min(1, { error: "En az bir ürün satırı girin." }),
  idempotencyKey: z.string().min(1),
});

export type ReceiptInput = z.input<typeof receiptInput>;

// Mal kabul: goods received from a supplier into one Lokasyon.
export async function recordReceipt(headers: Headers, input: ReceiptInput) {
  const parsed = receiptInput.safeParse(input);
  if (!parsed.success) throw new UserError(parsed.error.issues[0].message);
  const { lokasyonId, supplier, reference, lines, idempotencyKey } = parsed.data;
  const actor = await requirePermission(headers, "stock.receive", lokasyonId);

  return postDocument(
    { kind: "mal_kabul", lokasyonId, supplier: supplier || null, reference: reference || null, userId: actor.userId, idempotencyKey },
    lines.map((line) => ({ ...line, lokasyonId, direction: "in" as const, type: "mal_kabul" as const })),
  );
}
