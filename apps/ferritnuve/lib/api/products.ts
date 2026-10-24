import type { AirtableProduct } from "@/types/airtable";

export interface ProductsResponse {
  products: AirtableProduct[];
  count: number;
}

export interface ProductFilters {
  category?: string;
  type?: string;
}

export async function fetchProducts(
  filters?: ProductFilters
): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.type) params.set("type", filters.type);

  const url = `/api/products${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}
