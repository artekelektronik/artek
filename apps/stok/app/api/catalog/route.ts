import { getPublicCatalog } from "@/lib/catalog";

// Public, read-only catalog for the Vitrin (ADR-0002); CDN caches 5 min, stale up to a day.
export async function GET() {
  return Response.json(await getPublicCatalog(), {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
