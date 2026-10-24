import { NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog";
import { extractIdFromSlug } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const shortId = extractIdFromSlug(slug);

    const products = await getProducts();
    const product = products.find((p) => p.id.slice(-6) === shortId);

    if (!product) {
      console.error("[catalog] Product not found for slug:", slug);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log("[catalog] Returning product:", product.fields["Product Name"]);
    return NextResponse.json(product);
  } catch (error: unknown) {
    console.error("[catalog] Error reading product:", error);
    return NextResponse.json(
      { error: "Failed to load product", message: String(error) },
      { status: 500 }
    );
  }
}
