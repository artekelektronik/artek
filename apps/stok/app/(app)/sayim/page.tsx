import { headers } from "next/headers";
import Link from "next/link";
import { Badge } from "@artek/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { listCounts } from "@/lib/counts";
import { loadActor } from "@/lib/guard";
import { countKindLabels, countStatusLabels, formatDateTime } from "@/lib/labels";
import { lokasyonFor } from "@/lib/pickers";
import { listCategories } from "@/lib/products";
import { OpenCountForm } from "./open-count-form";

export const metadata = { title: "Sayım | Artek Stok" };

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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Açılış</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Lokasyon</TableHead>
            <TableHead>Kapsam</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Açan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {counts.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`/sayim/${c.id}`} className="underline-offset-4 hover:underline">
                  {formatDateTime(c.createdAt)}
                </Link>
              </TableCell>
              <TableCell>{countKindLabels[c.kind]}</TableCell>
              <TableCell>{c.lokasyonName}</TableCell>
              <TableCell>{c.category ?? "Tüm ürünler"}</TableCell>
              <TableCell>
                <Badge variant={c.status === "taslak" ? "default" : "secondary"}>{countStatusLabels[c.status]}</Badge>
              </TableCell>
              <TableCell>{c.createdBy}</TableCell>
            </TableRow>
          ))}
          {counts.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                Sayım yok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
