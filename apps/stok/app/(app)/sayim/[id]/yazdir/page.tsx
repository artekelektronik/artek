import { headers } from "next/headers";
import { notFound } from "next/navigation";
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
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="w-32 py-1">Kod</th>
                <th>Ürün</th>
                <th className="w-20">Birim</th>
                <th className="w-40">Sayılan</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.productId} className="border-b">
                  <td className="py-2 font-mono">{line.code}</td>
                  <td>{line.name}</td>
                  <td>{unitLabels[line.unit]}</td>
                  <td className="border-l" />
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
