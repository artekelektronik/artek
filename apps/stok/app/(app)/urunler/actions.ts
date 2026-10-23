"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runAction, type ActionState } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import { archiveProduct, createProduct, restoreProduct, updateProduct, type ProductInput } from "@/lib/products";

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function productFrom(formData: FormData): ProductInput {
  const shelves: Record<string, string> = {};
  for (const [key, value] of formData) if (key.startsWith("raf:")) shelves[key.slice(4)] = String(value);
  return {
    code: text(formData, "code"),
    name: text(formData, "name"),
    category: text(formData, "category"),
    isTradeGoods: formData.has("isTradeGoods"),
    isMaterial: formData.has("isMaterial"),
    unit: text(formData, "unit") as ProductInput["unit"],
    showOnSite: formData.has("showOnSite"),
    productType: text(formData, "productType"),
    subCategory: text(formData, "subCategory"),
    manufacturer: text(formData, "manufacturer"),
    manufacturerCode: text(formData, "manufacturerCode"),
    supplier: text(formData, "supplier"),
    supplierCountry: text(formData, "supplierCountry"),
    description: text(formData, "description"),
    images: lines(formData.get("images")),
    // "Etiket | https://…" per line
    datasheets: lines(formData.get("datasheets")).map((line) => {
      const [label, ...url] = line.split("|");
      return { label: label.trim(), url: url.join("|").trim() };
    }),
    shelves,
  };
}

export async function createProductAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let id = "";
  const state = await runAction(async () => {
    id = (await createProduct(await headers(), productFrom(formData))).id;
  });
  if (state) return state;
  redirect(`/urunler/${id}`);
}

export async function updateProductAction(id: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const state = await runAction(async () => updateProduct(await headers(), id, productFrom(formData)));
  revalidatePath(`/urunler/${id}`);
  return state ?? { saved: true };
}

export async function archiveProductAction(id: string) {
  await archiveProduct(await headers(), id);
  revalidatePath(`/urunler/${id}`);
}

export async function restoreProductAction(id: string) {
  await restoreProduct(await headers(), id);
  revalidatePath(`/urunler/${id}`);
}
