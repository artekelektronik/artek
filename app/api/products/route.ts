import { NextResponse } from "next/server";
import base from "@/lib/airtable";
import type { AirtableProduct } from "@/types/airtable";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const productType = searchParams.get("type");

    console.log("Fetching products from Airtable...");

    let selectOptions: any = {
      sort: [{ field: "Product Name", direction: "asc" }],
    };

    // Add filters if provided
    if (category || productType) {
      const filters = [];
      if (category) {
        filters.push(`{Category} = '${category}'`);
      }
      if (productType) {
        filters.push(`FIND('${productType}', ARRAYJOIN({Ürün Tipi}, ','))`);
      }
      selectOptions.filterByFormula =
        filters.length > 1 ? `AND(${filters.join(", ")})` : filters[0];
    }

    const records = await base("Ürünler").select(selectOptions).all();

    console.log(`Successfully fetched ${records.length} products`);

    const products: AirtableProduct[] = records.map((record) => ({
      id: record.id,
      fields: record.fields as any,
      createdTime: record._rawJson.createdTime,
    }));

    return NextResponse.json({ products, count: products.length });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        message: error.message,
        statusCode: error.statusCode,
      },
      { status: error.statusCode || 500 }
    );
  }
}
