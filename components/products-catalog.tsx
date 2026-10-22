"use client";

import { useMemo, Suspense } from "react";
import { ArrowRight, BadgeCheck, Package, ShieldCheck } from "lucide-react";
import {
  parseAsString,
  parseAsArrayOf,
  parseAsInteger,
  useQueryStates,
} from "nuqs";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFilters, type FilterState } from "@/components/product-filters";
import { ProductCard } from "@/components/product-card";
import { ProductControls } from "@/components/product-controls";
import { ProductPagination } from "@/components/product-pagination";
import { useProducts, usePrefetchProduct } from "@/hooks/use-products";
import { generateProductSlug } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

// Define search params parsers
const searchParamsParser = {
  // Filters
  categories: parseAsArrayOf(parseAsString).withDefault([]),
  altCategories: parseAsArrayOf(parseAsString).withDefault([]),
  productTypes: parseAsArrayOf(parseAsString).withDefault([]),
  supplierCountries: parseAsArrayOf(parseAsString).withDefault([]),

  // UI state
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(9),
  sort: parseAsString.withDefault("newest"),
  grid: parseAsInteger.withDefault(3),
};

function ProductsContent() {
  const t = useTranslations("products");
  const tFilters = useTranslations("filters");
  const tControls = useTranslations("controls");
  const prefetchProduct = usePrefetchProduct();

  // Use nuqs to manage URL search params
  const [params, setParams] = useQueryStates(searchParamsParser, {
    history: "push",
    shallow: true,
  });

  // Fetch products with React Query
  const { data, isLoading, error, refetch } = useProducts();

  const products = useMemo(() => data?.products || [], [data?.products]);

  // Convert URL params to FilterState
  const filters: FilterState = useMemo(
    () => ({
      selectedCategories: params.categories,
      selectedAltCategories: params.altCategories,
      selectedProductTypes: params.productTypes,
      selectedSupplierCountries: params.supplierCountries,
    }),
    [params]
  );

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Category filter
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter((product) =>
        filters.selectedCategories.includes(product.fields.Category || "")
      );
    }

    // Alt Category filter
    if (filters.selectedAltCategories.length > 0) {
      filtered = filtered.filter((product) => {
        const altCategories = product.fields["Alt Kategori"] || [];
        return altCategories.some((cat) =>
          filters.selectedAltCategories.includes(cat)
        );
      });
    }

    // Product Type filter
    if (filters.selectedProductTypes.length > 0) {
      filtered = filtered.filter((product) => {
        const productTypes = product.fields["Ürün Tipi"] || [];
        return productTypes.some((type) =>
          filters.selectedProductTypes.includes(type)
        );
      });
    }

    // Supplier Country filter
    if (filters.selectedSupplierCountries.length > 0) {
      filtered = filtered.filter((product) => {
        const countries = product.fields["Supplier Country"] || [];
        return countries.some((country) =>
          filters.selectedSupplierCountries.includes(country)
        );
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (params.sort) {
        case "name-asc":
          return a.fields["Product Name"].localeCompare(
            b.fields["Product Name"]
          );
        case "name-desc":
          return b.fields["Product Name"].localeCompare(
            a.fields["Product Name"]
          );
        case "price-asc": {
          const priceA =
            a.fields["Unit Price"] || a.fields["Parakende Fiyatı"] || 0;
          const priceB =
            b.fields["Unit Price"] || b.fields["Parakende Fiyatı"] || 0;
          return priceA - priceB;
        }
        case "price-desc": {
          const priceA =
            a.fields["Unit Price"] || a.fields["Parakende Fiyatı"] || 0;
          const priceB =
            b.fields["Unit Price"] || b.fields["Parakende Fiyatı"] || 0;
          return priceB - priceA;
        }
        case "newest":
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, filters, params.sort]);

  // Get unique filter values (memoized)
  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.fields.Category).filter(Boolean))
      ) as string[],
    [products]
  );

  const altCategories = useMemo(
    () =>
      Array.from(
        new Set(products.flatMap((p) => p.fields["Alt Kategori"] || []))
      ).filter(Boolean) as string[],
    [products]
  );

  const productTypes = useMemo(
    () =>
      Array.from(
        new Set(products.flatMap((p) => p.fields["Ürün Tipi"] || []))
      ).filter(Boolean) as string[],
    [products]
  );

  const supplierCountries = useMemo(
    () =>
      Array.from(
        new Set(products.flatMap((p) => p.fields["Supplier Country"] || []))
      ).filter(Boolean) as string[],
    [products]
  );

  // Pagination calculations
  const perPage = [9,10,18,20,36,50,72,100].includes(params.perPage) ? params.perPage : 9;
  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const page = Math.min(Math.max(1, params.page), Math.max(1,totalPages));
  const currentProducts = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, page, perPage]);

  // Handle filter changes - update URL params
  const handleFilterChange = (newFilters: FilterState) => {
    setParams({
      categories:
        newFilters.selectedCategories.length > 0
          ? newFilters.selectedCategories
          : null,
      altCategories:
        newFilters.selectedAltCategories.length > 0
          ? newFilters.selectedAltCategories
          : null,
      productTypes:
        newFilters.selectedProductTypes.length > 0
          ? newFilters.selectedProductTypes
          : null,
      supplierCountries:
        newFilters.selectedSupplierCountries.length > 0
          ? newFilters.selectedSupplierCountries
          : null,
      page: 1, // Reset to first page when filters change
    });
  };

  const handleReset = () => {
    setParams({
      categories: null,
      altCategories: null,
      productTypes: null,
      supplierCountries: null,
      sort: null,
      page: null,
      grid: null,
      perPage: null,
    });
  };

  if (isLoading) {
    return (
      <div role="status" aria-label={t("loading")} className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-6 w-full max-w-96" />
        </div>
        <div className="flex gap-8">
          <div className="w-64 hidden lg:block">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square w-full rounded-md" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="status" aria-label={t("loading")} className="container mx-auto px-4 py-8 mt-16">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <p className="font-semibold">{t("error")}</p>
          <p className="text-sm">
            {t("errorOccurred")}
          </p>
          <button onClick={() => refetch()} className="underline py-3">{t("retry")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-artek-porcelain pb-20 pt-14">
      <section className="bg-artek-navy px-6 py-14 text-white sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-artek-sky">
              {t("eyebrow")}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              {t("description")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <BadgeCheck className="size-6 text-artek-electric" />
              <p className="mt-3 text-sm font-semibold">{t("quality")}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <ShieldCheck className="size-6 text-artek-electric" />
              <p className="mt-3 text-sm font-semibold">{t("support")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout: Sidebar + Content */}
      <div className="mx-auto mt-10 flex flex-col lg:flex-row max-w-6xl gap-8 px-6">
        {/* Filters Sidebar - Sticky */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky top-24 h-fit lg:max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
          <details open className="group">
          <summary className="cursor-pointer py-3 lg:hidden">{tFilters("title")}</summary>
          <ProductFilters
            categories={categories}
            altCategories={altCategories}
            productTypes={productTypes}
            supplierCountries={supplierCountries}
            value={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            translations={{
              title: tFilters("title"),
              reset: tFilters("reset"),
              category: tFilters("category"),
              altCategory: tFilters("altCategory"),
              productType: tFilters("productType"),
              supplierCountry: tFilters("supplierCountry"),
            }}
          />
          </details>
        </aside>

        {/* Products Content */}
        <div className="flex-1 min-w-0">
          {/* Controls */}
          <div className="mb-6">
            <ProductControls
              gridColumns={params.grid}
              onGridColumnsChange={(cols) => {
                setParams({
                  grid: cols,
                  page: 1,
                  perPage: cols === 2 ? 10 : 9,
                });
              }}
              itemsPerPage={perPage}
              onItemsPerPageChange={(value) => {
                setParams({
                  perPage: value,
                  page: 1,
                });
              }}
              sortBy={params.sort}
              onSortChange={(sort) => setParams({ sort, page: 1 })}
              translations={{
                view: tControls("view"),
                sortBy: tControls("sortBy"),
                newest: tControls("sort.newest"),
                nameAsc: tControls("sort.nameAsc"),
                nameDesc: tControls("sort.nameDesc"),
                priceAsc: tControls("sort.priceAsc"),
                priceDesc: tControls("sort.priceDesc"),
              }}
            />
          </div>

          {/* Products Grid */}
          {currentProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">{t("noProducts")}</p>
              <p className="text-muted-foreground">
                {t("tryChangingFilters")}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-4"><button onClick={handleReset} className="rounded-lg border px-4 py-3">{tFilters("reset")}</button><Link href="/contact" className="rounded-lg bg-primary text-primary-foreground px-4 py-3">{t("contact")}</Link></div>
            </div>
          ) : (
            <>
              <div
                className={`grid gap-6 ${
                  params.grid === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {currentProducts.map((product) => {
                  const slug = generateProductSlug(
                    product.fields["Product Name"],
                    product.id
                  );
                  return (
                    <div
                      key={product.id}
                      onMouseEnter={() => prefetchProduct(slug)}
                    >
                      <ProductCard product={product} />
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <ProductPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(page) => setParams({ page })}
                />
              )}
            </>
          )}
        </div>
      </div>
      <section className="mx-auto mt-16 max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-6 rounded-3xl bg-artek-navy p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-semibold">{t("ctaTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t("ctaDescription")}</p>
          </div>
          <Link href="/contact" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-artek-electric px-6 text-sm font-bold text-artek-ink transition hover:bg-artek-sky">
            {t("ctaButton")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function ProductsPage() {
  const t = useTranslations("products");

  return (
    <>
      <Suspense
        fallback={
          <div role="status" aria-label={t("loading")} className="container mx-auto px-4 py-8 mt-16">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
              <Skeleton className="h-6 w-full max-w-96" />
            </div>
            <div className="flex gap-8">
              <div className="w-64 hidden lg:block">
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="aspect-square w-full rounded-md" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        }
      >
      <ProductsContent />
      </Suspense>
    </>
  );
}
