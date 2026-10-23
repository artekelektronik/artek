"use client";

import * as React from "react";
import { useEffect, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useProducts } from "@/hooks/use-products";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@artek/ui/components/command";
import { FileText, Package, Loader2 } from "lucide-react";
import { generateProductSlug } from "@/lib/utils";
import { productContent } from "@/lib/product-content";
import type { AirtableProduct } from "@/types/airtable";
import { DocumentAnalysisIllustration } from "@/components/illustrations/document-analysis";

// Bilingual search synonyms map (English ↔ Turkish)
const BILINGUAL_SYNONYMS: Record<string, string[]> = {
  // Filters
  filter: ["filtre", "filtreler"],
  filtre: ["filter", "filters"],
  filters: ["filtreler", "filtre"],
  filtreler: ["filters", "filter"],
  // Transformers
  transformer: ["transformatör", "trafo", "trafolar"],
  transformers: ["transformatörler", "trafolar", "trafo"],
  transformatör: ["transformer", "trafo"],
  transformatörler: ["transformers", "trafolar"],
  trafo: ["transformer", "transformatör"],
  trafolar: ["transformers", "transformatörler"],
  // Cores
  core: ["nüve", "nüveler", "çekirdek", "çekirdekler", "cekirdek", "cekirdekler"],
  cores: ["nüveler", "nüve", "çekirdekler", "cekirdekler"],
  nüve: ["core", "cores", "çekirdek"],
  nüveler: ["cores", "core", "çekirdekler"],
  çekirdek: ["core", "nüve"],
  çekirdekler: ["cores", "nüveler", "cekirdekler"],
  cekirdek: ["core", "nüve", "çekirdek"],
  cekirdekler: ["cores", "nüveler", "çekirdekler"],
  ferrite: ["ferrit"],
  ferrit: ["ferrite"],
  // Bobbins/Coils
  bobbin: ["karkas", "bobin"],
  bobbins: ["karkaslar", "bobinler"],
  karkas: ["bobbin", "bobin"],
  karkaslar: ["bobbins", "bobinler"],
  coil: ["bobin", "bobinler"],
  coils: ["bobinler", "bobin"],
  bobin: ["coil", "bobbin", "karkas"],
  bobinler: ["coils", "bobbins", "karkaslar"],
  // Inductors
  inductor: ["indüktör", "indüktörler"],
  inductors: ["indüktörler", "indüktör"],
  indüktör: ["inductor", "inductors"],
  indüktörler: ["inductors", "inductor"],
  // Power
  power: ["güç"],
  güç: ["power"],
  // Capacitors
  capacitor: ["kondansatör"],
  capacitors: ["kondansatörler"],
  kondansatör: ["capacitor"],
  kondansatörler: ["capacitors"],
  // EMI/EMC
  emi: ["elektromanyetik"],
  emc: ["elektromanyetik"],
  // Common terms
  laminated: ["saclı", "sac"],
  saclı: ["laminated"],
  sac: ["laminated", "laminate"],
  air: ["hava"],
  hava: ["air"],
  product: ["ürün"],
  products: ["ürünler"],
  ürün: ["product"],
  ürünler: ["products"],
  // Product Types / Shapes
  toroid: ["toroidal", "halka"],
  toroidal: ["toroid", "halka"],
  halka: ["toroid", "toroidal"],
  flat: ["yassı", "yassi"],
  yassı: ["flat", "yassi"],
  yassi: ["flat", "yassı"],
  round: ["yuvarlak"],
  yuvarlak: ["round", "circular"],
  rod: ["çubuk", "cubuk"],
  çubuk: ["rod", "cubuk"],
  cubuk: ["rod", "çubuk"],
  // Categories
  pem: ["pem"],
  cable: ["kablo"],
  kablo: ["cable"],
  iron: ["demir"],
  demir: ["iron"],
  powder: ["toz"],
  toz: ["powder"],
};

// Expand search term to include bilingual synonyms
function expandSearchTerms(query: string): string[] {
  const terms = [query];
  const lowerQuery = query.toLowerCase();

  // Check each word in the query for synonyms
  const words = lowerQuery.split(/\s+/);
  words.forEach(word => {
    if (BILINGUAL_SYNONYMS[word]) {
      terms.push(...BILINGUAL_SYNONYMS[word]);
    }
  });

  // Also check if the entire query has synonyms
  if (BILINGUAL_SYNONYMS[lowerQuery]) {
    terms.push(...BILINGUAL_SYNONYMS[lowerQuery]);
  }

  return [...new Set(terms)]; // Remove duplicates
}

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: "product" | "page";
  href: string;
  icon: React.ReactNode;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [, startTransition] = useTransition();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: products, isLoading } = useProducts();

  // Debounce the search query (150ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get default pages - memoized to avoid re-declarations
  const getDefaultPages = React.useCallback((): SearchResult[] => [
    {
      id: "products",
      title: t("nav.products"),
      subtitle: t("nav.brand"),
      category: "page",
      href: "/products",
      icon: <Package className="h-4 w-4" />,
    },
    {
      id: "about",
      title: t("nav.about"),
      subtitle: t("nav.brand"),
      category: "page",
      href: "/about",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "contact",
      title: t("nav.contact"),
      subtitle: t("nav.brand"),
      category: "page",
      href: "/contact",
      icon: <FileText className="h-4 w-4" />,
    },
  ], [t]);

  // Setup keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    startTransition(() => {
      const query = debouncedQuery.toLowerCase();
      const expandedTerms = expandSearchTerms(query); // Bilingual expansion
      let results: SearchResult[] = [];

      if (!debouncedQuery.trim()) {
        // Show default pages when search is empty
        results = getDefaultPages();
      } else {
        // Search pages (with bilingual support)
        const pageResults = getDefaultPages().filter(
          (page) =>
            expandedTerms.some(term =>
              page.title.toLowerCase().includes(term) ||
              page.subtitle?.toLowerCase().includes(term)
            )
        );
        results.push(...pageResults);

        // Search products with scoring algorithm for best matches
        if (products?.products) {
          // Calculate relevance score for each product
          const scoredProducts = products.products
            .map((product: AirtableProduct) => {
              const name = product.fields["Product Name"]?.toLowerCase() || "";
              const code = product.fields["Product Code"]?.toLowerCase() || "";
              const category = product.fields.Category?.toLowerCase() || "";
              const subCategories =
                product.fields["Alt Kategori"]?.map((s) => s.toLowerCase()) || [];
              const types =
                product.fields["Ürün Tipi"]?.map((t) => t.toLowerCase()) || [];
              const description = product.fields.Description?.toLowerCase() || "";

              let score = 0;

              // Score for each expanded term (bilingual support)
              expandedTerms.forEach((term, index) => {
                // Slightly lower weight for synonym matches
                const weight = index === 0 ? 1 : 0.8;

                // Exact match scores (highest priority)
                if (name === term) score += 100 * weight;
                if (code === term) score += 90 * weight;
                if (category === term) score += 70 * weight;
                if (subCategories.some((s) => s === term)) score += 65 * weight;
                if (types.some((t) => t === term)) score += 60 * weight;

                // Starts with match (high priority)
                if (name.startsWith(term)) score += 50 * weight;
                if (code.startsWith(term)) score += 45 * weight;

                // Word boundary match (product name contains the term as a whole word)
                const termWords = term.split(/\s+/);
                const nameWords = name.split(/\s+/);
                termWords.forEach(tWord => {
                  if (nameWords.some(nWord => nWord === tWord)) score += 30 * weight;
                  if (nameWords.some(nWord => nWord.startsWith(tWord))) score += 20 * weight;
                });

                // Contains match (medium priority)
                if (name.includes(term)) score += 25 * weight;
                if (code.includes(term)) score += 20 * weight;
                if (category.includes(term)) score += 15 * weight;
                if (subCategories.some((s) => s.includes(term))) score += 14 * weight;
                if (types.some((t) => t.includes(term))) score += 12 * weight;
                if (description.includes(term)) score += 5 * weight;

                // Partial word matches for fuzzy search
                termWords.forEach(tWord => {
                  if (tWord.length >= 2) {
                    if (name.includes(tWord)) score += 8 * weight;
                    if (code.includes(tWord)) score += 6 * weight;
                    if (category.includes(tWord)) score += 4 * weight;
                    if (subCategories.some((s) => s.includes(tWord))) score += 4 * weight;
                    if (types.some((t) => t.includes(tWord))) score += 3 * weight;
                  }
                });
              });

              return { product, score };
            })
            // Filter products with any score (matched something)
            .filter(({ score }) => score > 0)
            // Sort by score descending
            .sort((a, b) => b.score - a.score)
            // Take top matches (at least 3 if available)
            .slice(0, Math.max(10, 3));

          const productResults = scoredProducts.map(({ product }) => {
            const slug = generateProductSlug(
              product.fields["Product Name"],
              product.id
            );
            return {
              id: product.id,
              title: productContent(product,locale).name,
              subtitle:
                product.fields["Product Code"] ||
                product.fields.Category ||
                undefined,
              category: "product" as const,
              href: `/products/${slug}`,
              icon: <Package className="h-4 w-4" />,
            };
          });

          results.push(...productResults);
        }
      }

      setSearchResults(results);
    });
  }, [debouncedQuery, products, getDefaultPages, locale]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearchQuery("");
    router.push(href, { locale });
  };

  return (
    <>
      <CommandDialog
        title={t("nav.search")}
        description={t("search.placeholder")}
        closeLabel={t("nav.closeMenu")}
        open={open}
        onOpenChange={setOpen}
        className="ring-4 ring-white/30"
      >
        <CommandInput
          aria-label={t("search.placeholder")}
          placeholder={t("search.placeholder") || "Search products, pages..."}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <DocumentAnalysisIllustration />
                <p className="text-sm text-muted-foreground">
                  {t("search.noResults") || "No document found"}
                </p>
              </div>
            )}
          </CommandEmpty>

          {/* Pages Group */}
          {searchResults.some((r) => r.category === "page") && (
            <CommandGroup
              heading={t("search.pages") || "Pages"}
              className="overflow-hidden"
            >
              {searchResults
                .filter((r) => r.category === "page")
                .map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelect(result.href)}
                    className="cursor-pointer"
                  >
                    {result.icon}
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}

          {/* Products Group */}
          {searchResults.some((r) => r.category === "product") && (
            <CommandGroup
              heading={t("search.products") || "Products"}
              className="overflow-hidden"
            >
              {searchResults
                .filter((r) => r.category === "product")
                .slice(0, 10)
                .map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelect(result.href)}
                    className="cursor-pointer"
                  >
                    {result.icon}
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
        </CommandList>

        {/* Keyboard hint */}
        <div className="border-t px-2 py-1.5 text-xs text-muted-foreground">
          <span className="hidden sm:inline">
            {t("search.pressEsc") || "Press ESC to close"}
          </span>
        </div>
      </CommandDialog>
    </>
  );
}
