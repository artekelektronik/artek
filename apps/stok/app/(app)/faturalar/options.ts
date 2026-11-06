import { z } from "zod";
import { displayQuantity } from "@/lib/labels";
import { formatQuantity } from "@/lib/quantity";

export const notInCatalogue = "yok"; // a line's product choice when it isn't an Ürün (labour, freight)

export const decimal = (value: string) => displayQuantity(formatQuantity(value));
export const toNumber = (value: string) => Number(value.replace(",", "."));
const positive = (v: string) => toNumber(v) > 0;

// Pieces both invoice forms build their line schema from.
export const amount = (error: string) => z.string().refine(positive, { error });
export const modeSchema = z.enum(["stok", "uretim", "yok"]); // from stock, built from materials, or stock untouched
export type Mode = z.infer<typeof modeSchema>;
export const componentsSchema = z.array(z.object({ productId: z.string().min(1, { error: "Malzemeyi seçin." }), quantity: amount("Miktar?") }));
export const needsMaterials: [(l: { mode: Mode; components: unknown[] }) => boolean, { path: string[]; error: string }] = [
  (l) => l.mode !== "uretim" || l.components.length > 0,
  { path: ["components"], error: "En az bir malzeme ekleyin." },
];

export const lineNet = (lines: { quantity: string; unitPrice: string }[]) =>
  lines.reduce((sum, l) => sum + (toNumber(l.quantity) * toNumber(l.unitPrice) || 0), 0);

// A picked Ürün is built from materials if it has a reçete or is an Özel trafo (never on an İade), else taken from stock.
export function modeFor(productId: string, o: { recipes: Record<string, unknown>; builtToOrder: boolean; isReturn: boolean }): Mode {
  if (!productId || productId === notInCatalogue) return "yok";
  return !o.isReturn && (o.recipes[productId] || o.builtToOrder) ? "uretim" : "stok";
}

// Category goes in as a search keyword, so "ferrit" finds every ferrite Ürün.
export const productOption = (p: { id: string; name: string; code: string; category: string }) => ({
  value: p.id,
  label: `${p.name} · ${p.code}`,
  keywords: [p.category],
});

export const suggestedFirst = <T extends { id: string }, O>(items: T[], suggestions: string[], toOption: (item: T) => O) => {
  const suggested = new Set(suggestions);
  return [...items.filter((i) => suggested.has(i.id)), ...items.filter((i) => !suggested.has(i.id))].map(toOption);
};

export const scaledRecipe = (recipe: { productId: string; quantity: string }[] | undefined, quantity: string) =>
  (recipe ?? []).map((c) => ({ productId: c.productId, quantity: decimal(String(Number(c.quantity) * toNumber(quantity))) }));
