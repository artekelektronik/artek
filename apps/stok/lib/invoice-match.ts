// Suggests a confirming invoice's Müşteri and line Ürünler. Pure: a person confirms every choice.
import type { InvoiceBuyer } from "../db/schema";
import { productName } from "./invoice-parse";
import { normFirm } from "./lead-match";
import { compact } from "./product-search";

export const newCustomer = "yeni"; // confirm with the buyer as printed as a new Müşteri
const suggestionCount = 5;

type CustomerOption = { id: string; name: string; taxId: string };
type ProductOption = { id: string; code: string; name: string; manufacturerCode: string | null };

// The Müşteri with the buyer's VKN / TCKN, else firms whose names share words with it, best first.
export function matchCustomer(buyer: InvoiceBuyer, customers: CustomerOption[]) {
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
    .slice(0, suggestionCount)
    .map((c) => c.id);
  return { customerId: null, suggestions };
}

// Words split where letters meet digits ("ETD39" → ETD, 39), so sizes line up with the catalogue.
const tokens = (text: string) =>
  productName(text)
    .replace(/(?<=\p{L})(?=\p{N})|(?<=\p{N})(?=\p{L})/gu, " ")
    .split(/[^\p{L}\p{N}]+/u)
    .map(compact)
    .filter(Boolean);
// Trusted only if it can't be a plain number or size ("100", "6MM").
const distinctive = (code: string) => code.length >= 4 && /\p{L}/u.test(code) && /\p{N}/u.test(code);

export type PreparedProduct = { id: string; own: string; words: string[]; code: string };

// Done once per invoice, not per line.
export const prepareProducts = (products: ProductOption[]): PreparedProduct[] =>
  products.map((p) => ({ id: p.id, own: compact(p.code), words: tokens(p.name), code: compact(p.manufacturerCode ?? "") }));

// Our own codes written on the line, e.g. "BOBİN(ART- 9.8FT)" → "art98ft".
const artCodes = (description: string) => [...description.matchAll(/(?<!\p{L})ART[\s-]*([\p{L}\p{N}][\p{L}\p{N}.\/-]*)/giu)].map((m) => compact(`ART${m[1]}`));

// Picks only when sure (our ART code on the line, an earlier confirmation, a manufacturer code, or a uniquely covering name); always ranks the closest.
export function matchProduct(description: string, products: PreparedProduct[], learned: Map<string, string>) {
  const written = artCodes(description);
  const byCode = products.find((p) => written.includes(p.own));
  if (byCode) return { productId: byCode.id, suggestions: [byCode.id] };
  const lineWords = new Set(tokens(description));
  const text = compact(description);
  const scored = products
    .map((p) => ({
      id: p.id,
      score: distinctive(p.code) && text.includes(p.code) ? 2 : p.words.filter((w) => lineWords.has(w)).length / Math.max(p.words.length, 1),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);
  const suggestions = scored.slice(0, suggestionCount).map((p) => p.id);
  const known = learned.get(productName(description));
  if (known && products.some((p) => p.id === known)) return { productId: known, suggestions };
  const [best, next] = scored;
  const sure = best && best.score >= 0.75 && (!next || next.score < best.score);
  return { productId: sure ? best.id : null, suggestions };
}
