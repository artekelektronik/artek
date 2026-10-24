import { headers } from "next/headers";
import { z } from "zod";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { MovementTable } from "@/components/movement-table";
import { loadActor } from "@/lib/guard";
import { listMovements } from "@/lib/ledger";
import { can } from "@/lib/permissions";

export const metadata = { title: "Stok hareketleri | Artek Stok" };

// A date picked in the filter is a day in Istanbul (UTC+3, no daylight saving).
const istanbulDay = (day: string | undefined, time: string) =>
  day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T${time}+03:00`) : undefined;
// Filters come from the URL; anything malformed is ignored rather than sent to the database.
const id = (value: string | undefined) => (value && z.uuid().safeParse(value).success ? value : undefined);

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ baslangic?: string; bitis?: string; urun?: string }>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  // The date range (and a product, from its page) narrows what is loaded; the table filters the rest.
  const movements = await listMovements(requestHeaders, {
    from: istanbulDay(params.baslangic, "00:00:00"),
    to: istanbulDay(params.bitis, "23:59:59.999"),
    productId: id(params.urun),
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Stok hareketleri</h1>
      <form className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Başlangıç
          <Input type="date" name="baslangic" defaultValue={params.baslangic} className="w-40" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Bitiş
          <Input type="date" name="bitis" defaultValue={params.bitis} className="w-40" />
        </label>
        {params.urun && <input type="hidden" name="urun" value={params.urun} />}
        <Button type="submit" variant="outline">
          Tarihleri uygula
        </Button>
      </form>
      <MovementTable
        key={[params.baslangic, params.bitis, params.urun].join("|")}
        movements={movements}
        canReverse={can(actor, "stock.reverse")}
      />
      {movements.length === 500 && <p className="text-muted-foreground text-sm">En yeni 500 hareket yüklendi; tarih aralığını daraltın.</p>}
    </div>
  );
}
