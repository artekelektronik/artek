import { useInfiniteQuery } from "@tanstack/react-query";
import type { AirtableProduct } from "@/types/airtable";
import { productKeys } from "./use-products";

interface InfiniteProductsResponse {
  products: AirtableProduct[];
  nextOffset?: number;
  hasMore: boolean;
}

export function useInfiniteProducts(limit: number = 20) {
  return useInfiniteQuery({
    queryKey: [...productKeys.all, "infinite"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(
        `/api/products?offset=${pageParam}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      
      return {
        products: data.products,
        nextOffset: pageParam + limit,
        hasMore: data.products.length === limit,
      } as InfiniteProductsResponse;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
    initialPageParam: 0,
  });
}
