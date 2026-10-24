import { headers } from "next/headers";
import { Button } from "@artek/ui/components/button";
import { getOverview } from "@/lib/overview";
import { listCategories } from "@/lib/products";
import { selectClassName } from "@/lib/ui";
import { listLokasyon } from "@/lib/lokasyon";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { OverviewTable } from "./overview-table";

export const metadata = { title: "Stok durumu | Artek Stok" };

type Params = { lokasyon?: string; kritik?: string };

export default async function OverviewPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const requestHeaders = await headers();
  // Lokasyon and Kritik seviye change what is loaded; the table searches, filters and sorts the rest.
  const [overview, categories, actor, allLokasyon] = await Promise.all([
    getOverview(requestHeaders, { lokasyonId: params.lokasyon || undefined, belowMinimum: params.kritik === "1" }),
    listCategories(requestHeaders),
    loadActor(requestHeaders),
    listLokasyon(),
  ]);
  const visible = allLokasyon.filter((l) => can(actor, "stock.view", l.id));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Stok durumu</h1>
      <form className="flex flex-wrap items-center gap-2">
        <select name="lokasyon" defaultValue={params.lokasyon ?? ""} className={selectClassName} aria-label="Lokasyon">
          <option value="">Tüm Lokasyonlar</option>
          {visible.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        {overview.canFilterBelowMinimum && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="kritik" value="1" defaultChecked={params.kritik === "1"} />
            Kritik seviyenin altındakiler
          </label>
        )}
        <Button type="submit" variant="outline">
          Uygula
        </Button>
      </form>
      <OverviewTable key={`${params.lokasyon ?? ""}|${params.kritik ?? ""}`} overview={overview} categories={categories} />
    </div>
  );
}
