import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "./use-products";
import type { AirtableProduct } from "@/types/airtable";

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: AirtableProduct) => {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product.fields),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      return response.json();
    },
    onMutate: async (newProduct) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: productKeys.detail(newProduct.id),
      });

      // Snapshot previous value
      const previousProduct = queryClient.getQueryData(
        productKeys.detail(newProduct.id)
      );

      // Optimistically update
      queryClient.setQueryData(productKeys.detail(newProduct.id), newProduct);

      return { previousProduct };
    },
    onError: (err, newProduct, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(
          productKeys.detail(newProduct.id),
          context.previousProduct
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
    },
  });
}
