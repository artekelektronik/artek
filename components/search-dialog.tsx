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
} from "@/components/ui/command";
import { FileText, Package, Loader2 } from "lucide-react";
import { generateProductSlug } from "@/lib/utils";
import type { AirtableProduct } from "@/types/airtable";

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
  const [, startTransition] = useTransition();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: products, isLoading } = useProducts();

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

  // Perform search when query changes
  useEffect(() => {
    startTransition(() => {
      const query = searchQuery.toLowerCase();
      let results: SearchResult[] = [];

      if (!searchQuery.trim()) {
        // Show default pages when search is empty
        results = getDefaultPages();
      } else {
        // Search pages
        const pageResults = getDefaultPages().filter(
          (page) =>
            page.title.toLowerCase().includes(query) ||
            page.subtitle?.toLowerCase().includes(query)
        );
        results.push(...pageResults);

        // Search products
        if (products?.products) {
          const productResults = products.products
            .filter((product: AirtableProduct) => {
              const name = product.fields["Product Name"]?.toLowerCase() || "";
              const code = product.fields["Product Code"]?.toLowerCase() || "";
              const category = product.fields.Category?.toLowerCase() || "";
              const types =
                product.fields["Ürün Tipi"]?.map((t) => t.toLowerCase()) || [];

              return (
                name.includes(query) ||
                code.includes(query) ||
                category.includes(query) ||
                types.some((t) => t.includes(query))
              );
            })
            .map((product: AirtableProduct) => {
              const slug = generateProductSlug(
                product.fields["Product Name"],
                product.id
              );
              return {
                id: product.id,
                title: product.fields["Product Name"],
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
  }, [searchQuery, products, getDefaultPages]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearchQuery("");
    router.push(href, { locale });
  };

  return (
    <>
      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
        className="ring-4 ring-white/30"
      >
        <CommandInput
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
              t("search.noResults") || "No results found."
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
