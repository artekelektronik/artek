import { displayQuantity } from "@/lib/labels";
import { formatQuantity } from "@/lib/quantity";

export const notInCatalogue = "yok"; // a line's product choice when it isn't an Ürün (labour, freight)

export const decimal = (value: string) => displayQuantity(formatQuantity(value));
export const toNumber = (value: string) => Number(value.replace(",", "."));

// Category goes in as a search keyword, so "ferrit" finds every ferrite Ürün.
export const productOption = (p: { id: string; name: string; code: string; category: string }) => ({
  value: p.id,
  label: `${p.name} · ${p.code}`,
  keywords: p.category,
});

export const suggestedFirst = <T extends { id: string }, O>(items: T[], suggestions: string[], toOption: (item: T) => O) => {
  const suggested = new Set(suggestions);
  return [...items.filter((i) => suggested.has(i.id)), ...items.filter((i) => !suggested.has(i.id))].map(toOption);
};
