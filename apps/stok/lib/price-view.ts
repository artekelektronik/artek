import { sortRows, type Sort } from "./sorting";

// What the Fiyatlar screen filters and sorts on. Pure, and in the browser, on rows the page already loaded.

export type PriceFacts = {
  code: string;
  name: string;
  category: string;
  productType: string | null;
  search: string; // already lowercased, Turkish-style
  total: number;
  quantities: Record<string, number>; // per Lokasyon id
  hasPurchase: boolean;
  hasSale: boolean;
};

export const priceStates = { tumu: "Tümü", eksik: "Eksik", alis_eksik: "Alış eksik", satis_eksik: "Satış eksik", tamam: "Tamam" } as const;
export const stockStates = { tumu: "Tümü", stokta: "Stokta", yok: "Stok yok" } as const;

export type PriceFilter = {
  price: keyof typeof priceStates;
  stock: keyof typeof stockStates;
  categories: string[];
  types: string[];
  lokasyon: string[];
  q: string;
};

export const noType = "Tipsiz";
export const typeOf = (row: { productType: string | null }) => row.productType ?? noType;

// With a Lokasyon picked, "stock" means what sits there, for both the filter and the sort.
const quantityIn = (row: PriceFacts, lokasyon: string[]) => (lokasyon.length ? lokasyon.reduce((sum, id) => sum + (row.quantities[id] ?? 0), 0) : row.total);

function priceMatches(row: PriceFacts, state: PriceFilter["price"]) {
  if (state === "eksik") return !row.hasPurchase || !row.hasSale;
  if (state === "alis_eksik") return !row.hasPurchase;
  if (state === "satis_eksik") return !row.hasSale;
  if (state === "tamam") return row.hasPurchase && row.hasSale;
  return true;
}

function stockMatches(row: PriceFacts, f: PriceFilter) {
  const quantity = quantityIn(row, f.lokasyon);
  if (f.stock === "yok") return quantity <= 0;
  return f.stock === "stokta" || f.lokasyon.length ? quantity > 0 : true;
}

export function viewPrices<T extends PriceFacts>(rows: T[], f: PriceFilter, sorts: Sort[]): T[] {
  const needle = f.q.trim().toLocaleLowerCase("tr");
  const shown = rows.filter(
    (r) =>
      priceMatches(r, f.price) &&
      stockMatches(r, f) &&
      (!f.categories.length || f.categories.includes(r.category)) &&
      (!f.types.length || f.types.includes(typeOf(r))) &&
      (!needle || r.search.includes(needle)),
  );
  return sortRows(shown, sorts, (r, id) => {
    if (id === "stok") return quantityIn(r, f.lokasyon);
    if (id === "ad") return r.name;
    if (id === "kod") return r.code;
    if (id === "kategori") return r.category;
    return r.productType;
  });
}

// Sorts in the address bar: "stok.azalan,ad.artan".
export const encodeSorts = (sorts: Sort[]) => sorts.map((s) => `${s.id}.${s.desc ? "azalan" : "artan"}`).join(",");
export const decodeSorts = (text: string): Sort[] =>
  text
    .split(",")
    .filter(Boolean)
    .map((part) => {
      const [id, direction] = part.split(".");
      return { id, desc: direction === "azalan" };
    });
