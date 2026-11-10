// Which invoice line each of an invoice's stock movements came from, and what it sold for. Pure, so tests need no database.
import type { LineComponent } from "../db/schema";

export type InvoiceMove = { id: string; documentId: string; type: string; productId: string; quantity: string };
export type InvoiceLineSold = {
  invoiceId: string;
  documentId: string;
  seq: number;
  issuedOn: string;
  productId: string | null;
  quantity: string;
  stockQuantity: string | null;
  amount: string;
  components: LineComponent[] | null;
};
// TL, KDV hariç; `key` is the line, so a built line's several materials count once in a total.
export type MovePrice = { key: string; unit: number; total: number; on: string };

const same = (a: string, b: string) => Math.abs(Math.abs(Number(a)) - Number(b)) < 1e-9;

// Movements don't record their line: a stocked line is found by product and quantity, a built one by the material it used.
export function priceInvoiceMoves(moves: InvoiceMove[], lines: InvoiceLineSold[]) {
  const prices = new Map<string, MovePrice>();
  const used = new Set<InvoiceLineSold>();
  for (const m of moves) {
    const candidates = lines.filter((l) => l.documentId === m.documentId);
    const l =
      m.type === "uretim_tuketimi"
        ? candidates.find((c) => c.components?.some((k) => k.productId === m.productId && same(m.quantity, k.quantity)))
        : candidates.find((c) => !used.has(c) && !c.components && c.productId === m.productId && c.stockQuantity !== null && same(m.quantity, c.stockQuantity));
    if (!l) continue;
    if (m.type !== "uretim_tuketimi") used.add(l);
    prices.set(m.id, { key: `${l.invoiceId}:${l.seq}`, unit: Number(l.amount) / Number(l.quantity), total: Number(l.amount), on: l.issuedOn });
  }
  return prices;
}
