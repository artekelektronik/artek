import { asc } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { MovementTable } from "@/components/movement-table";
import { db } from "@/db";
import { user } from "@/db/schema";
import { loadActor } from "@/lib/guard";
import { movementTypeLabels } from "@/lib/labels";
import { listMovements, type MovementType } from "@/lib/ledger";
import { can } from "@/lib/permissions";
import { lokasyonFor } from "@/lib/pickers";
import { selectClassName } from "@/lib/ui";

export const metadata = { title: "Stok hareketleri | Artek Stok" };

// A date picked in the filter is a day in Istanbul (UTC+3, no daylight saving).
const istanbulDay = (day: string | undefined, time: string) =>
  day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T${time}+03:00`) : undefined;
// Filters come from the URL; anything malformed is ignored rather than sent to the database.
const id = (value: string | undefined) => (value && z.uuid().safeParse(value).success ? value : undefined);
const movementType = (value: string | undefined) =>
  value && value in movementTypeLabels ? (value as MovementType) : undefined;

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ baslangic?: string; bitis?: string; tur?: string; kullanici?: string; lokasyon?: string; urun?: string }>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  const [movements, lokasyon, users] = await Promise.all([
    listMovements(requestHeaders, {
      from: istanbulDay(params.baslangic, "00:00:00"),
      to: istanbulDay(params.bitis, "23:59:59.999"),
      type: movementType(params.tur),
      userId: params.kullanici || undefined,
      lokasyonId: id(params.lokasyon),
      productId: id(params.urun),
    }),
    lokasyonFor(actor, "stock.view"),
    db.select({ id: user.id, name: user.name }).from(user).orderBy(asc(user.name)),
  ]);

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
        <select name="tur" defaultValue={params.tur ?? ""} className={selectClassName} aria-label="Hareket türü">
          <option value="">Tüm türler</option>
          {Object.entries(movementTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="kullanici" defaultValue={params.kullanici ?? ""} className={selectClassName} aria-label="Kullanıcı">
          <option value="">Tüm kullanıcılar</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select name="lokasyon" defaultValue={params.lokasyon ?? ""} className={selectClassName} aria-label="Lokasyon">
          <option value="">Tüm Lokasyonlar</option>
          {lokasyon.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        {params.urun && <input type="hidden" name="urun" value={params.urun} />}
        <Button type="submit" variant="outline">
          Filtrele
        </Button>
      </form>
      <MovementTable movements={movements} canReverse={can(actor, "stock.reverse")} />
      {movements.length === 500 && <p className="text-muted-foreground text-sm">En yeni 500 hareket gösteriliyor; filtreyi daraltın.</p>}
    </div>
  );
}
