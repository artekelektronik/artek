// Suggests the Müşteri and the Ürün of each line for an invoice under review. Pure: a person confirms every choice.
import type { InvoiceBuyer } from "../db/schema";
import { productName } from "./invoice-parse";
import { normFirm } from "./lead-match";

type CustomerOption = { id: string; name: string; taxId: string };
type ProductOption = { id: string; code: string; name: string; manufacturerCode: string | null };

// The Müşteri with the invoice's VKN / TCKN; otherwise up to `limit` firms whose names share words with the buyer's.
export function matchCustomer(buyer: InvoiceBuyer, customers: CustomerOption[], limit = 5) {
  const exact = customers.find((c) => c.taxId === buyer.taxId);
  if (exact) return { customerId: exact.id, suggestions: [] };
  const words = new Set(normFirm(buyer.name).split(" ").filter((w) => w.length >= 3));
  const suggestions = customers
    .map((c) => {
      const theirs = normFirm(c.name).split(" ").filter((w) => w.length >= 3);
      const shared = theirs.filter((w) => words.has(w)).length;
      return { id: c.id, score: shared / Math.max(words.size, theirs.length, 1) };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.id);
  return { customerId: null, suggestions };
}

// "FERRİTNUVE(ETD39)" → FERRİT NÜVE, ETD, 39: words split where letters meet digits, so sizes line up with the catalogue.
function tokens(text: string) {
  return text
    .toLocaleUpperCase("tr")
    .replace(/(?<=\p{L})(?=\p{N})|(?<=\p{N})(?=\p{L})/gu, " ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}
const squash = (s: string) => s.toLocaleUpperCase("tr").replace(/[^\p{L}\p{N}]+/gu, "");
// A manufacturer code is trusted only if it can't be a plain number or size ("100", "6MM").
const distinctive = (code: string) => code.length >= 4 && /\p{L}/u.test(code) && /\p{N}/u.test(code);

// The Ürün a line most likely is, and the closest others to list first. Picked only when sure: the Ürün an earlier
// confirmed line of the same name was, a manufacturer code written in the line, or a catalogue name that covers the
// line's words and no other does as well.
export function matchProduct(description: string, products: ProductOption[], learned: Map<string, string>, limit = 5) {
  const known = learned.get(productName(description));
  const lineWords = new Set(tokens(productName(description)));
  const text = squash(description);
  const scored = products
    .map((p) => {
      const words = tokens(productName(p.name));
      const covered = words.filter((w) => lineWords.has(w)).length / Math.max(words.length, 1);
      const code = p.manufacturerCode ? squash(p.manufacturerCode) : "";
      return { id: p.id, score: distinctive(code) && text.includes(code) ? 2 : covered };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);
  const suggestions = scored.slice(0, limit).map((p) => p.id);
  if (known && products.some((p) => p.id === known)) return { productId: known, suggestions };
  const [best, next] = scored;
  const sure = best && best.score >= 0.75 && (!next || next.score < best.score);
  return { productId: sure ? best.id : null, suggestions };
}
