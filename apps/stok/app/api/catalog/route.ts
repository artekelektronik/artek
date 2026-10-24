import { getPublicCatalog } from "@/lib/catalog";

// Public and read-only: the Vitrin reads its products here (ADR-0002). The CDN keeps a copy for
// 5 minutes and may serve it stale for a day while the app or database is unreachable.
export async function GET() {
  return Response.json(await getPublicCatalog(), {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
