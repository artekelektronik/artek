import { useQuery } from "@tanstack/react-query";
import { fetchProducts, type ProductFilters } from "@/lib/api/products";

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", "list", filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 1000 * 60 * 5,
  });
}
