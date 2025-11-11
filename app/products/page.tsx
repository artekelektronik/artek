"use client";

import { useMemo, Suspense } from "react";
import { Package } from "lucide-react";
import { parseAsString, parseAsArrayOf, parseAsInteger, parseAsBoolean, useQueryStates } from "nuqs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFilters, type FilterState } from "@/components/product-filters";
import { ProductCard } from "@/components/product-card";
import { ProductControls } from "@/components/product-controls";
import { ProductPagination } from "@/components/product-pagination";
import { useProducts, usePrefetchProduct } from "@/hooks/use-products";
import type { AirtableProduct } from "@/types/airtable";

// Define search params parsers
const searchParamsParser = {
  // Filters
  categories: parseAsArrayOf(parseAsString).withDefault([]),
  altCategories: parseAsArrayOf(parseAsString).withDefault([]),
  productTypes: parseAsArrayOf(parseAsString).withDefault([]),
  supplierCountries: parseAsArrayOf(parseAsString).withDefault([]),
  minPrice: parseAsInteger.withDefault(0),
  maxPrice: parseAsInteger.withDefault(10000),
  inStock: parseAsBoolean.withDefault(false),
  
  // UI state
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(9),
  sort: parseAsString.withDefault("newest"),
  grid: parseAsInteger.withDefault(3),
};

function ProductsContent() {
  const prefetchProduct = usePrefetchProduct();
  
  // Use nuqs to manage URL search params
  const [params, setParams] = useQueryStates(searchParamsParser, {
    history: "push",
    shallow: true,
  });
  
  // Fetch products with React Query
  const { data, isLoading, error } = useProducts();
  
  const products = data?.products || [];

  // Convert URL params to FilterState
  const filters: FilterState = useMemo(() => ({
    priceRange: { min: params.minPrice, max: params.maxPrice },
    selectedCategories: params.categories,
    selectedAltCategories: params.altCategories,
    selectedProductTypes: params.productTypes,
    selectedSupplierCountries: params.supplierCountries,
    inStockOnly: params.inStock,
  }), [params]);

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter((product) => (product.fields["Stock Quantity"] || 0) > 0);
    }

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
        return altCategories.some((cat) => filters.selectedAltCategories.includes(cat));
      });
    }

    // Product Type filter
    if (filters.selectedProductTypes.length > 0) {
      filtered = filtered.filter((product) => {
        const productTypes = product.fields["Ürün Tipi"] || [];
        return productTypes.some((type) => filters.selectedProductTypes.includes(type));
      });
    }

    // Supplier Country filter
    if (filters.selectedSupplierCountries.length > 0) {
      filtered = filtered.filter((product) => {
        const countries = product.fields["Supplier Country"] || [];
        return countries.some((country) => filters.selectedSupplierCountries.includes(country));
      });
    }

    // Price filter
    filtered = filtered.filter((product) => {
      const price = product.fields["Unit Price"] || product.fields["Parakende Fiyatı"] || 0;
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (params.sort) {
        case "name-asc":
          return a.fields["Product Name"].localeCompare(b.fields["Product Name"]);
        case "name-desc":
          return b.fields["Product Name"].localeCompare(a.fields["Product Name"]);
        case "price-asc": {
          const priceA = a.fields["Unit Price"] || a.fields["Parakende Fiyatı"] || 0;
          const priceB = b.fields["Unit Price"] || b.fields["Parakende Fiyatı"] || 0;
          return priceA - priceB;
        }
        case "price-desc": {
          const priceA = a.fields["Unit Price"] || a.fields["Parakende Fiyatı"] || 0;
          const priceB = b.fields["Unit Price"] || b.fields["Parakende Fiyatı"] || 0;
          return priceB - priceA;
        }
        case "stock-desc":
          return (b.fields["Stock Quantity"] || 0) - (a.fields["Stock Quantity"] || 0);
        case "newest":
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, filters, params.sort]);

  // Get unique filter values (memoized)
  const categories = useMemo(() => 
    Array.from(
      new Set(products.map((p) => p.fields.Category).filter(Boolean))
    ) as string[],
    [products]
  );

  const altCategories = useMemo(() =>
    Array.from(
      new Set(products.flatMap((p) => p.fields["Alt Kategori"] || []))
    ).filter(Boolean) as string[],
    [products]
  );

  const productTypes = useMemo(() =>
    Array.from(
      new Set(products.flatMap((p) => p.fields["Ürün Tipi"] || []))
    ).filter(Boolean) as string[],
    [products]
  );

  const supplierCountries = useMemo(() =>
    Array.from(
      new Set(products.flatMap((p) => p.fields["Supplier Country"] || []))
    ).filter(Boolean) as string[],
    [products]
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / params.perPage);
  const currentProducts = useMemo(() => {
    const startIndex = (params.page - 1) * params.perPage;
    const endIndex = startIndex + params.perPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, params.page, params.perPage]);

  // Handle filter changes - update URL params
  const handleFilterChange = (newFilters: FilterState) => {
    setParams({
      categories: newFilters.selectedCategories.length > 0 ? newFilters.selectedCategories : null,
      altCategories: newFilters.selectedAltCategories.length > 0 ? newFilters.selectedAltCategories : null,
      productTypes: newFilters.selectedProductTypes.length > 0 ? newFilters.selectedProductTypes : null,
      supplierCountries: newFilters.selectedSupplierCountries.length > 0 ? newFilters.selectedSupplierCountries : null,
      minPrice: newFilters.priceRange.min !== 0 ? newFilters.priceRange.min : null,
      maxPrice: newFilters.priceRange.max !== 10000 ? newFilters.priceRange.max : null,
      inStock: newFilters.inStockOnly ? newFilters.inStockOnly : null,
      page: 1, // Reset to first page when filters change
    });
  };

  const handleReset = () => {
    setParams({
      categories: null,
      altCategories: null,
      productTypes: null,
      supplierCountries: null,
      minPrice: null,
      maxPrice: null,
      inStock: null,
      sort: null,
      page: null,
      grid: null,
      perPage: null,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-6 w-96" />
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
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <p className="font-semibold">Hata</p>
          <p className="text-sm">{error instanceof Error ? error.message : "Bir hata oluştu"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Ürünler</h1>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-8">
        {/* Filters Sidebar - Sticky */}
        <aside className="w-64 hidden lg:block shrink-0 sticky top-24 h-fit max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
          <ProductFilters
            categories={categories}
            altCategories={altCategories}
            productTypes={productTypes}
            supplierCountries={supplierCountries}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />
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
              itemsPerPage={params.perPage}
              onItemsPerPageChange={(value) => {
                setParams({
                  perPage: value,
                  page: 1,
                });
              }}
              sortBy={params.sort}
              onSortChange={(sort) => setParams({ sort })}
              totalItems={filteredProducts.length}
            />
          </div>

          {/* Products Grid */}
          {currentProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Ürün bulunamadı</p>
              <p className="text-muted-foreground">
                Filtrelerinizi değiştirmeyi deneyin
              </p>
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
                {currentProducts.map((product) => (
                  <div
                    key={product.id}
                    onMouseEnter={() => prefetchProduct(product.id)}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <ProductPagination
                  currentPage={params.page}
                  totalPages={totalPages}
                  onPageChange={(page) => setParams({ page })}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-6 w-96" />
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
    }>
      <ProductsContent />
    </Suspense>
  );
}
