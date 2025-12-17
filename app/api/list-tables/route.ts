import { NextResponse } from "next/server";
import type { AirtableTableMeta, AirtableApiError } from "@/types/airtable";

interface AirtableTablesResponse {
  tables: AirtableTableMeta[];
}

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

    const tablesData = data as AirtableTablesResponse;
    return NextResponse.json({
      tables: tablesData.tables.map((t: AirtableTableMeta) => ({
        id: t.id,
        name: t.name,
        description: t.description,
      })),
    });
  } catch (error: unknown) {
    const apiError = error as AirtableApiError;
    return NextResponse.json(
      { error: "Request failed", message: apiError.message },
      { status: 500 }
    );
  }
}
