import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { getCount } from "@/lib/counts";
import { countKindLabels, formatDateTime } from "@/lib/labels";
import { unitLabels } from "@/lib/quantity";
import { PrintButton } from "./print-button";

// Paper count sheet: products grouped by Raf kodu with an empty quantity column to fill in.
export default async function CountSheetPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const count = await getCount(await headers(), id);
  if (!count) notFound();

  const groups = new Map<string, typeof count.lines>();
  for (const line of count.lines) {
    const shelf = line.rafKodu ?? "Raf kodu yok";
    groups.set(shelf, [...(groups.get(shelf) ?? []), line]);
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {countKindLabels[count.kind]} listesi · {count.lokasyonName}
          </h1>
          <p className="text-muted-foreground">
            {count.category ?? "Tüm ürünler"} · {formatDateTime(count.createdAt)} · Sayan: ____________ · Tarih/saat: ____________
          </p>
        </div>
        <PrintButton />
      </div>
      {[...groups].map(([shelf, lines]) => (
        <section key={shelf} className="break-inside-avoid">
          <h2 className="border-b py-1 font-semibold">Raf {shelf}</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Kod</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead className="w-20">Birim</TableHead>
                <TableHead className="w-40">Sayılan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.productId}>
                  <TableCell className="font-mono">{line.code}</TableCell>
                  <TableCell>{line.name}</TableCell>
                  <TableCell>{unitLabels[line.unit]}</TableCell>
                  <TableCell className="border-l" />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ))}
    </div>
  );
}
