import { NextResponse } from "next/server";
import { getProductsFromCSV } from "@/lib/csv-products";
import { extractIdFromSlug } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const shortId = extractIdFromSlug(slug);

    const products = getProductsFromCSV();
    const product = products.find((p) => p.id.slice(-6) === shortId);

    if (!product) {
      console.error("[CSV] Product not found for slug:", slug);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log("[CSV] Returning product:", product.fields["Product Name"]);
    return NextResponse.json(product);
  } catch (error: unknown) {
    console.error("[CSV] Error reading product:", error);
    return NextResponse.json(
      { error: "Failed to load product", message: String(error) },
      { status: 500 }
    );
  }
}
