// Rows from <ProductLines>; an unpicked product keeps an empty id so the ledger rejects it, not drops it.
export function productLinesFrom(formData: FormData) {
  const productIds = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map(String);
  return productIds.map((productId, index) => ({ productId, quantity: quantities[index] ?? "" }));
}

export function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}
