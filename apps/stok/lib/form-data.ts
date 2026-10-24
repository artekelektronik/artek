// Product + quantity rows submitted by <ProductLines>. A row whose product wasn't picked from the list
// keeps an empty id, so the ledger reports it as an unknown product instead of silently dropping it.
export function productLinesFrom(formData: FormData) {
  const productIds = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map(String);
  return productIds.map((productId, index) => ({ productId, quantity: quantities[index] ?? "" }));
}

export function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}
