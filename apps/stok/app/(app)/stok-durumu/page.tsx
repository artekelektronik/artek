import { headers } from "next/headers";
import { Button } from "@artek/ui/components/button";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Label } from "@artek/ui/components/label";
import { FormSelect } from "@/components/form-select";
import { getOverview } from "@/lib/overview";
import { listCategories } from "@/lib/products";
import { listLokasyon } from "@/lib/lokasyon";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { OverviewTable } from "./overview-table";

export const metadata = { title: "Stok durumu | Artek Stok" };

type Params = { lokasyon?: string; kritik?: string };

export default async function OverviewPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const requestHeaders = await headers();
  // Lokasyon and Kritik seviye change what is loaded; the table filters the rest.
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
        <FormSelect
          name="lokasyon"
          options={visible.map((l) => ({ value: l.id, label: l.name }))}
          defaultValue={params.lokasyon}
          empty="Tüm Lokasyonlar"
          aria-label="Lokasyon"
        />
        {overview.canFilterBelowMinimum && (
          <Label className="font-normal">
            <Checkbox name="kritik" value="1" defaultChecked={params.kritik === "1"} />
            Kritik seviyenin altındakiler
          </Label>
        )}
        <Button type="submit" variant="outline">
          Uygula
        </Button>
      </form>
      <OverviewTable key={`${params.lokasyon ?? ""}|${params.kritik ?? ""}`} overview={overview} categories={categories} />
    </div>
  );
}
