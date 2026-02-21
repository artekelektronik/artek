import { NextResponse } from "next/server";
import { getProductsFromCSV } from "@/lib/csv-products";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const productType = searchParams.get("type");

    let products = getProductsFromCSV();

    // Apply optional filters
    if (category) {
      products = products.filter((p) => p.fields.Category === category);
    }
    if (productType) {
      products = products.filter((p) =>
        (p.fields["Ürün Tipi"] ?? []).includes(productType)
      );
    }

    console.log(`[CSV] Returning ${products.length} products`);
    return NextResponse.json({ products, count: products.length });
  } catch (error: unknown) {
    console.error("[CSV] Error reading products:", error);
    return NextResponse.json(
      { error: "Failed to load products", message: String(error) },
      { status: 500 }
    );
  }
}
