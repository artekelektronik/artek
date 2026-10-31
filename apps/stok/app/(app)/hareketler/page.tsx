import { headers } from "next/headers";
import { Button } from "@artek/ui/components/button";
import { Label } from "@artek/ui/components/label";
import { MovementTable } from "@/components/movement-table";
import { DatePicker } from "@/components/date-picker";
import { isUuid } from "@/lib/errors";
import { loadActor } from "@/lib/guard";
import { listMovements, movementLimit } from "@/lib/ledger";
import { can } from "@/lib/permissions";
import { istanbulTimeOn } from "@/lib/time";

export const metadata = { title: "Stok hareketleri | Artek" };

const istanbulDay = (day: string | undefined, time: string) =>
  day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? istanbulTimeOn(day, time) : undefined;
// Malformed URL filters are ignored rather than sent to the database.
const id = (value: string | undefined) => (isUuid(value) ? value : undefined);

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ baslangic?: string; bitis?: string; urun?: string }>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  // Dates and product narrow what is loaded; the table filters the rest.
  const movements = await listMovements(requestHeaders, {
    from: istanbulDay(params.baslangic, "00:00:00"),
    to: istanbulDay(params.bitis, "23:59:59.999"),
    productId: id(params.urun),
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Stok hareketleri</h1>
      <form className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="baslangic">Başlangıç</Label>
          <DatePicker id="baslangic" name="baslangic" defaultValue={params.baslangic} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitis">Bitiş</Label>
          <DatePicker id="bitis" name="bitis" defaultValue={params.bitis} />
        </div>
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
      {movements.length === movementLimit && (
        <p className="text-muted-foreground text-sm">En yeni {movementLimit} hareket yüklendi; tarih aralığını daraltın.</p>
      )}
    </div>
  );
}
