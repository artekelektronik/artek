import translations from "./product-translations.json";
import type { AirtableProduct } from "../types/airtable";

export function productContent(product: AirtableProduct, locale: string) {
  const key = `product-${Number(product.id.slice(-6))}`;
  const entry = (translations as Record<string, {name: string; description?: string}>)[key];
  // Remove internal inventory notes and empty fields, not technical values.
  const source = product.fields.Description?.split("\n").filter(line =>
    !/^(Tedarikçi Firma|Ortalama Aylık|Ağırlık:\s*$|wudumfg\.com|spinel\.cn|\+2)/.test(line.trim())
  ).join("\n").trim();
  return {
    name: locale === "en" ? entry?.name ?? product.fields["Product Name"] : product.fields["Product Name"],
    description: locale === "en" ? entry?.description : source,
    reviewRequired: [1, 3, 11, 12, 14, 73, 74, 75].includes(Number(product.id.slice(-6))),
  };
}
