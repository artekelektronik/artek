import { NotSignedIn } from "@/lib/guard";
import { getOverview } from "@/lib/overview";
import { toCsv } from "@/lib/overview-csv";

// Same filters and the same Lokasyon visibility as the Stok durumu page.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  let overview;
  try {
    overview = await getOverview(request.headers, {
      q: params.get("q") ?? undefined,
      category: params.get("kategori") || undefined,
      lokasyonId: params.get("lokasyon") || undefined,
    });
  } catch (error) {
    if (error instanceof NotSignedIn) return new Response(error.message, { status: 401 });
    throw error;
  }
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(new Date());
  return new Response(toCsv(overview), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="stok-durumu-${day}.csv"`,
    },
  });
}
