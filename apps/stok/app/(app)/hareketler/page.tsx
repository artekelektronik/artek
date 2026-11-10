import { headers } from "next/headers";
import { MovementTable } from "@/components/movement-table";
import { DateRangeForm } from "@/components/date-range-form";
import { isUuid } from "@/lib/errors";
import { loadActor } from "@/lib/guard";
import { listMovements, movementLimit } from "@/lib/ledger";
import { can } from "@/lib/permissions";
import { exitValues } from "@/lib/stock-out-report";
import { dayRange } from "@/lib/time";

export const metadata = { title: "Stok hareketleri | Artek" };

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
  const range = dayRange(params);
  // Dates and product narrow what is loaded; the table filters the rest.
  const movements = await listMovements(requestHeaders, {
    ...range,
    productId: id(params.urun),
  });

  const values = await exitValues(actor, movements);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <h1 className="text-2xl font-semibold">Stok hareketleri</h1>
      <DateRangeForm params={params} keep={{ urun: params.urun }} />
      <MovementTable
        key={`${range.key}|${params.urun ?? ""}`}
        movements={movements}
        canReverse={can(actor, "stock.reverse")}
        values={values}
      />
      {movements.length === movementLimit && (
        <p className="text-muted-foreground text-sm">En yeni {movementLimit} hareket yüklendi; tarih aralığını daraltın.</p>
      )}
    </div>
  );
}
