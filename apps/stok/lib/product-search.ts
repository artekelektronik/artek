export type SearchableProduct = {
  id: string;
  code: string;
  name: string;
  category: string;
  manufacturerCode: string | null;
  productType: string | null;
};

// How the items relate to what was typed; the picker words its heading from this.
export type SearchKind = "all" | "exact" | "matches" | "other-category" | "similar" | "none";

const similarLimit = 8;

const folded: Record<string, string> = { ı: "i", ş: "s", ç: "c", ğ: "g", ü: "u", ö: "o" };

// "EE 110 / 56" and "ee110/56" are the same to someone typing; so are "Çekirdek" and "cekirdek".
export function compact(text: string) {
  return text
    .normalize("NFKC")
    .replace(/İ/g, "i")
    .toLowerCase()
    .replace(/[ışçğüö]/g, (letter) => folded[letter])
    .normalize("NFD")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

const wordsOf = (text: string) => text.split(/[^\p{L}\p{N}.,]+/u).map(compact).filter(Boolean);

function editDistance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

function matchRank<T extends SearchableProduct>(product: T, query: string, words: string[]) {
  const code = compact(product.code);
  const name = compact(product.name);
  const maker = compact(product.manufacturerCode ?? "");
  // ART-0040 is also just "40".
  const number = code.match(/0*([1-9]\d*)$/)?.[1];
  if (query === code || query === maker || query === name || query.replace(/^0+/, "") === number) return 0;
  if (code.startsWith(query) || name.startsWith(query) || maker.startsWith(query)) return 1;
  if (code.includes(query) || name.includes(query) || maker.includes(query)) return 2;
  // Word by word, so "EE 26" won't pair an EE core with code ART-0026, nor "UU 17" read across "101 / 76".
  const described = [product.name, product.manufacturerCode, product.category, product.productType].flatMap((field) => wordsOf(field ?? ""));
  return words.every((word) => described.some((part) => part.includes(word))) ? 2 : null;
}

function closeness<T extends SearchableProduct>(product: T, query: string) {
  const fields = [product.code, product.name, product.manufacturerCode ?? ""].map(compact).filter(Boolean);
  return Math.min(...fields.map((field) => editDistance(query, field.slice(0, query.length))));
}

export function searchProducts<T extends SearchableProduct>(
  products: T[],
  typed: string,
  { category, available = {} }: { category?: string; available?: Record<string, string> } = {},
): { kind: SearchKind; items: T[] } {
  const inStock = (product: T) => (Number(available[product.id] ?? 0) > 0 ? 0 : 1);
  const byStockThenCode = (a: T, b: T) => inStock(a) - inStock(b) || a.code.localeCompare(b.code, "tr", { numeric: true });
  const pool = category ? products.filter((product) => product.category === category) : products;
  const query = compact(typed);
  if (!query) return { kind: "all", items: [...pool].sort(byStockThenCode) };

  const words = wordsOf(typed);
  const matches = (list: T[]) =>
    list
      .map((product) => ({ product, rank: matchRank(product, query, words) }))
      .filter((hit): hit is { product: T; rank: number } => hit.rank !== null)
      .sort((a, b) => a.rank - b.rank || byStockThenCode(a.product, b.product));

  const hits = matches(pool);
  if (hits.length > 0) {
    return { kind: hits[0].rank === 0 ? "exact" : "matches", items: hits.map((hit) => hit.product) };
  }
  const elsewhere = matches(products);
  if (elsewhere.length > 0) return { kind: "other-category", items: elsewhere.map((hit) => hit.product) };

  // Half the typed characters may differ; beyond that a suggestion is noise.
  const allowed = Math.max(1, Math.floor(query.length / 2));
  const similar = products
    .map((product) => ({ product, distance: closeness(product, query) }))
    .filter((hit) => hit.distance <= allowed)
    .sort((a, b) => a.distance - b.distance || byStockThenCode(a.product, b.product))
    .slice(0, similarLimit)
    .map((hit) => hit.product);
  return similar.length > 0 ? { kind: "similar", items: similar } : { kind: "none", items: [] };
}

export function categoriesOf(products: { category: string }[]) {
  const counts = new Map<string, number>();
  for (const { category } of products) counts.set(category, (counts.get(category) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr"));
}
