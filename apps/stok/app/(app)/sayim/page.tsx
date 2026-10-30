import { headers } from "next/headers";
import { listCounts } from "@/lib/counts";
import { loadActor } from "@/lib/guard";
import { lokasyonFor } from "@/lib/pickers";
import { listCategories } from "@/lib/products";
import { OpenCountForm } from "./open-count-form";
import { CountsTable } from "./counts-table";

export const metadata = { title: "Sayım | Artek" };

export default async function CountsPage() {
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  const [lokasyon, categories, counts] = await Promise.all([
    lokasyonFor(actor, "count.perform"),
    listCategories(requestHeaders),
    listCounts(requestHeaders),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Sayım</h1>
      <p className="text-muted-foreground max-w-3xl text-sm">
        Sayım sırasında satış ve transfer durmaz. Her satır sayıldığı andaki stokla karşılaştırılır; fark, onaylandığında bir kez
        düzeltme hareketi olur.
      </p>
      {lokasyon.length > 0 && <OpenCountForm lokasyon={lokasyon} categories={categories} kind="sayim" />}

      <CountsTable counts={counts} />
    </div>
  );
}
