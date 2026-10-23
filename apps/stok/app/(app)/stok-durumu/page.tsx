import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@artek/ui/components/table";
import { displayQuantity } from "@/lib/labels";
import { getOverview } from "@/lib/overview";
import { listCategories } from "@/lib/products";
import { unitLabels, type Unit } from "@/lib/quantity";
import { selectClassName } from "@/lib/ui";
import { listLokasyon } from "@/lib/lokasyon";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";

export const metadata = { title: "Stok durumu | Artek Stok" };

type Params = { q?: string; kategori?: string; lokasyon?: string };

export default async function OverviewPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const [overview, categories, actor, allLokasyon] = await Promise.all([
    getOverview(requestHeaders, { q: params.q, category: params.kategori, lokasyonId: params.lokasyon || undefined }),
    listCategories(requestHeaders),
    loadActor(requestHeaders),
    listLokasyon(),
  ]);
  const visible = allLokasyon.filter((l) => can(actor, "stock.view", l.id));
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const quantityCell = "text-right tabular-nums";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Stok durumu</h1>
        <Button asChild variant="outline">
          <a href={`/stok-durumu/csv${query ? `?${query}` : ""}`}>CSV indir</a>
        </Button>
      </div>

      <form className="flex flex-wrap items-end gap-2">
        <Input name="q" defaultValue={params.q} placeholder="Ürün kodu veya adı" className="w-56" />
        <select name="kategori" defaultValue={params.kategori ?? ""} className={selectClassName} aria-label="Kategori">
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select name="lokasyon" defaultValue={params.lokasyon ?? ""} className={selectClassName} aria-label="Lokasyon">
          <option value="">Tüm Lokasyonlar</option>
          {visible.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filtrele
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2}>Ürün</TableHead>
            {overview.lokasyon.map((l) => (
              <TableHead key={l.id} colSpan={3} className="text-center">
                {l.name}
              </TableHead>
            ))}
            <TableHead rowSpan={2} className="text-right">
              Yolda
            </TableHead>
            <TableHead rowSpan={2} className="text-right">
              Toplam
            </TableHead>
          </TableRow>
          <TableRow>
            {overview.lokasyon.flatMap((l) => [
              <TableHead key={`${l.id}-p`} className="text-right">
                Fiziksel
              </TableHead>,
              <TableHead key={`${l.id}-r`} className="text-right">
                Ayrılmış
              </TableHead>,
              <TableHead key={`${l.id}-a`} className="text-right">
                Kullanılabilir
              </TableHead>,
            ])}
          </TableRow>
        </TableHeader>
        <TableBody>
          {overview.rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link href={`/urunler/${row.id}`} className="font-mono underline-offset-4 hover:underline">
                  {row.code}
                </Link>{" "}
                {row.name} <span className="text-muted-foreground text-xs">{unitLabels[row.unit]}</span>
              </TableCell>
              {overview.lokasyon.flatMap((l) => [
                <TableCell key={`${l.id}-p`} className={quantityCell}>
                  {displayQuantity(row.stock[l.id].physical)}
                </TableCell>,
                <TableCell key={`${l.id}-r`} className={quantityCell}>
                  {displayQuantity(row.stock[l.id].reserved)}
                </TableCell>,
                <TableCell key={`${l.id}-a`} className={quantityCell}>
                  {displayQuantity(row.stock[l.id].available)}
                </TableCell>,
              ])}
              <TableCell className={quantityCell}>{displayQuantity(row.inTransit)}</TableCell>
              <TableCell className={`${quantityCell} font-medium`}>{displayQuantity(row.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          {Object.entries(overview.totals).map(([unit, totals]) => (
            <TableRow key={unit}>
              <TableCell>Toplam ({unitLabels[unit as Unit]})</TableCell>
              {overview.lokasyon.flatMap((l) => [
                <TableCell key={`${l.id}-p`} className={quantityCell}>
                  {displayQuantity(totals.stock[l.id].physical)}
                </TableCell>,
                <TableCell key={`${l.id}-r`} className={quantityCell}>
                  {displayQuantity(totals.stock[l.id].reserved)}
                </TableCell>,
                <TableCell key={`${l.id}-a`} className={quantityCell}>
                  {displayQuantity(totals.stock[l.id].available)}
                </TableCell>,
              ])}
              <TableCell className={quantityCell}>{displayQuantity(totals.inTransit)}</TableCell>
              <TableCell className={quantityCell}>{displayQuantity(totals.total)}</TableCell>
            </TableRow>
          ))}
        </TableFooter>
      </Table>
      <p className="text-muted-foreground text-sm">
        {overview.rows.length} ürün. Yolda: transferde olup henüz teslim alınmamış miktar; hiçbir Lokasyonda sayılmaz.
      </p>
    </div>
  );
}
