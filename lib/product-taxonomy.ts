export const productCatalogPaths = {
  all: "/products",
  pem: "/products?categories=PEM",
  ferrit: "/products?categories=Ferrit",
  eeFerrit: "/products?categories=Ferrit&productTypes=EE",
  etdFerrit: "/products?categories=Ferrit&productTypes=ETD",
  toroidFerrit: "/products?categories=Ferrit&productTypes=TOROID",
  ironPowder: "/products?categories=IRON-POWDER",
} as const;

// Catalog values remain unchanged in URLs. Empty product groups use existing introductions.
export const productGroups = [
  {key: "ferrite", href: productCatalogPaths.ferrit, tr: "Ferrit Nüveler", en: "Ferrite Cores"},
  {key: "bobbins", href: "/bobin", tr: "Bobinler", en: "Bobbins"},
  {key: "transformers", href: "/transformator", tr: "Transformatörler", en: "Transformers"},
  {key: "inductors", href: "/bobin#applications", tr: "İndüktörler", en: "Inductors"},
  {key: "emi", href: productCatalogPaths.pem, tr: "Güç / EMI Filtreleri", en: "Power / EMI Filters"},
] as const;
export function groupName(group: typeof productGroups[number], locale: string) {
  return locale === "en" ? group.en : group.tr;
}
export function catalogLabel(value: string, locale: string): string {
  const labels: Record<string, [string, string]> = {
    Ferrit: ["Ferrit", "Ferrite"], PEM: ["Güç / EMI Filtreleri", "Power / EMI Filters"],
    "IRON-POWDER": ["Demir Tozu Nüveler", "Iron Powder Cores"],
    "IRON POWDER": ["Demir Tozu", "Iron Powder"],
    Cekirdekler: ["Çekirdekler", "Cores"], "ferrit kablo çekirdekleri": ["Ferrit Kablo Çekirdekleri", "Ferrite Cable Cores"],
    YUVARLAK: ["Yuvarlak", "Round"], CUBUK: ["Çubuk", "Rod"], YASSI: ["Yassı", "Flat"],
    China: ["Çin", "China"], Germany: ["Almanya", "Germany"], "Çin": ["Çin", "China"], "Türkiye": ["Türkiye", "Turkey"],
  };
  return labels[value]?.[locale === "en" ? 1 : 0] ?? value;
}

export const productGroup = Object.fromEntries(productGroups.map(group => [group.key, group])) as Record<typeof productGroups[number]["key"], typeof productGroups[number]>;
