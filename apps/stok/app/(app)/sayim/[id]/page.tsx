import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { StockForm } from "@/components/stock-form";
import { getCount } from "@/lib/counts";
import { loadActor } from "@/lib/guard";
import { countKindLabels, countStatusLabels, displayQuantity, formatDateTime } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { unitLabels } from "@/lib/quantity";
import { approveCountAction, cancelCountAction, saveCountLinesAction } from "../actions";
import { CountedInput, CountSheetForm } from "../count-sheet";

export default async function CountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestHeaders = await headers();
  const [actor, count] = await Promise.all([loadActor(requestHeaders), getCount(requestHeaders, id)]);
  if (!count) notFound();
  const open = count.status === "taslak";
  const canCount = open && can(actor, "count.perform", count.lokasyonId);
  const canApprove = open && can(actor, "count.approve", count.lokasyonId);
  const countedLines = count.lines.filter((l) => l.counted !== null).length;
  const isOpening = count.kind === "acilis";

  const table = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Raf</TableHead>
          <TableHead>Ürün</TableHead>
          <TableHead>Sayılan</TableHead>
          {!isOpening && <TableHead className="text-right">Sayım anındaki stok</TableHead>}
          {!isOpening && <TableHead className="text-right">Fark</TableHead>}
          <TableHead>Sayan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {count.lines.map((line) => (
          <TableRow key={line.productId}>
            <TableCell className="font-mono">{line.rafKodu ?? "—"}</TableCell>
            <TableCell>
              <span className="font-mono">{line.code}</span> {line.name}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {canCount ? (
                <CountedInput productId={line.productId} code={line.code} defaultValue={line.counted ? displayQuantity(line.counted) : ""} />
              ) : line.counted !== null ? (
                displayQuantity(line.counted)
              ) : (
                "—"
              )}{" "}
              <span className="text-muted-foreground text-sm">{unitLabels[line.unit]}</span>
            </TableCell>
            {!isOpening && (
              <TableCell className="text-right tabular-nums">
                {line.balanceAtCount !== null ? displayQuantity(line.balanceAtCount) : ""}
              </TableCell>
            )}
            {!isOpening && (
              <TableCell className="text-right tabular-nums">
                {line.difference !== null && line.difference !== "0" ? displayQuantity(line.difference) : line.difference === "0" ? "0" : ""}
              </TableCell>
            )}
            <TableCell className="text-sm">
              {line.countedBy ? `${line.countedBy} · ${formatDateTime(line.countedAt!)}` : ""}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {countKindLabels[count.kind]} · {count.lokasyonName}
        </h1>
        <Badge variant={open ? "default" : "secondary"}>{countStatusLabels[count.status]}</Badge>
        <Button asChild variant="outline" size="sm">
          <Link href={`/sayim/${count.id}/yazdir`}>Sayım listesini yazdır</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        {count.category ?? "Tüm ürünler"} · Açan: {count.createdBy} · {formatDateTime(count.createdAt)}
        {count.approvedBy && ` — Onaylayan: ${count.approvedBy} · ${formatDateTime(count.approvedAt!)}`}
        {count.cancelledAt && ` — İptal: ${formatDateTime(count.cancelledAt)}`}
        {` — ${countedLines}/${count.lines.length} satır sayıldı`}
      </p>

      {canCount ? <CountSheetForm action={saveCountLinesAction.bind(null, count.id)}>{table}</CountSheetForm> : table}

      {canApprove && (
        <div className="flex flex-wrap items-start gap-6 border-t pt-4">
          <StockForm
            action={approveCountAction.bind(null, count.id)}
            submitLabel={isOpening ? "Açılış sayımını onayla" : "Farkları onayla"}
            savedMessage="Onaylandı."
          >
            <p className="text-muted-foreground max-w-md text-sm">
              {isOpening
                ? "Onaylandığında sayılan miktarlar açılış stoku olur ve bu Lokasyonda diğer hareketler başlar."
                : "Onaylandığında sayılan satırların farkı bir kez düzeltme hareketi olarak kaydedilir. Sayılmayan satırlar değişmez."}
            </p>
          </StockForm>
          <form action={async () => {
            "use server";
            await cancelCountAction(count.id);
          }}>
            <Button type="submit" variant="outline">
              Sayımı iptal et
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
