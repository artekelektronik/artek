export const productCatalogPaths = {
  all: "/products",
  pem: "/products?categories=PEM",
  ferrit: "/products?categories=Ferrit",
  eeFerrit: "/products?categories=Ferrit&productTypes=EE",
  etdFerrit: "/products?categories=Ferrit&productTypes=ETD",
  toroidFerrit: "/products?categories=Ferrit&productTypes=TOROID",
  ironPowder: "/products?categories=IRON-POWDER",
} as const;
