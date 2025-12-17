import { NextResponse } from "next/server";
import base from "@/lib/airtable";
import { extractIdFromSlug } from "@/lib/utils";
import type { AirtableProduct, AirtableApiError, ProductFields } from "@/types/airtable";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    console.log("Fetching product with slug:", slug);

    // Extract the short ID from the slug
    const shortId = extractIdFromSlug(slug);
    
    // Fetch all products and find the matching one
    const records = await base("Ürünler").select().all();
    
    const product = records.find((record) => {
      const recordShortId = record.id.slice(-6);
      return recordShortId === shortId;
    });

    if (!product) {
      console.error("Product not found for slug:", slug);
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    console.log("Successfully fetched product:", product.fields["Product Name"]);

    const result: AirtableProduct = {
      id: product.id,
      fields: product.fields as unknown as ProductFields,
      createdTime: product._rawJson.createdTime,
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error fetching product:", error);
    const apiError = error as AirtableApiError;
    return NextResponse.json(
      {
        error: "Failed to fetch product",
        message: apiError.message,
        statusCode: apiError.statusCode,
      },
      { status: apiError.statusCode || 500 }
    );
  }
}
