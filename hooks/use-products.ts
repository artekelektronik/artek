import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProducts,
  fetchProduct,
  type ProductFilters,
} from "@/lib/api/products";

// Query Keys Factory
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters?: ProductFilters) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Fetch all products with optional filters
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch single product by slug
export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => fetchProduct(slug),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!slug,
  });
}

// Prefetch product (for hover/navigation)
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(slug),
      queryFn: () => fetchProduct(slug),
      staleTime: 1000 * 60 * 10,
    });
  };
}
