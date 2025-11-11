import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProducts,
  fetchProduct,
  type ProductFilters,
} from "@/lib/api/products";
import type { AirtableProduct } from "@/types/airtable";

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
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes for real-time stock updates
    refetchIntervalInBackground: true, // Continue refetching even when tab is not focused
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
