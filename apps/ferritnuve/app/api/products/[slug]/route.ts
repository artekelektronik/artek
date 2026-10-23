import { NextResponse } from "next/server";
import { getProductsFromJSON } from "@/lib/local-products";
import { extractIdFromSlug } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const shortId = extractIdFromSlug(slug);

    const products = getProductsFromJSON();
    const product = products.find((p) => p.id.slice(-6) === shortId);

    if (!product) {
      console.error("[local-json] Product not found for slug:", slug);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log("[local-json] Returning product:", product.fields["Product Name"]);
    return NextResponse.json(product);
  } catch (error: unknown) {
    console.error("[local-json] Error reading product:", error);
    return NextResponse.json(
      { error: "Failed to load product", message: String(error) },
      { status: 500 }
    );
  }
}
