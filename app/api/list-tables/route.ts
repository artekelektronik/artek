import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  try {
    // Get base schema to see all tables
    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch tables", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      tables: data.tables.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Request failed", message: error.message },
      { status: 500 }
    );
  }
}
