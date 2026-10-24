import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Input } from "@artek/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { StockForm } from "@/components/stock-form";
import { loadActor } from "@/lib/guard";
import { displayQuantity, formatDateTime } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { unitLabels } from "@/lib/quantity";
import { getTransfer, lossReasonLabels } from "@/lib/transfers";
import { selectClassName } from "@/lib/ui";
import { receiveTransferAction } from "../actions";
import { TransferStatusBadge } from "../transfer-status";

export default async function TransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestHeaders = await headers();
  const [actor, found] = await Promise.all([loadActor(requestHeaders), getTransfer(requestHeaders, id)]);
  if (!found) notFound();
  const canReceive = found.status === "yolda" && can(actor, "stock.transfer", found.toLokasyonId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {found.fromName} → {found.toName}
        </h1>
        <TransferStatusBadge status={found.status} />
      </div>
      <p className="text-muted-foreground text-sm">
        Sevk: {found.sentBy} · {formatDateTime(found.sentAt)}
        {found.receivedBy && ` — Teslim alma: ${found.receivedBy} · ${formatDateTime(found.receivedAt!)}`}
        {found.note && ` — ${found.note}`}
      </p>

      {canReceive ? (
        <StockForm
          action={receiveTransferAction.bind(null, found.id)}
          submitLabel="Teslim al"
          savedMessage="Teslim alındı; stok güncellendi."
        >
          <p className="text-muted-foreground text-sm">
            Gelen miktarı girin. Eksik kalan miktar şimdi kayıp ya da hasarlı olarak kapatılır.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Gönderilen</TableHead>
                <TableHead>Gelen</TableHead>
                <TableHead>Eksik varsa neden</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {found.lines.map((line) => (
                <TableRow key={line.productId}>
                  <TableCell>
                    <span className="font-mono">{line.code}</span> {line.name}
                    <input type="hidden" name="productId" value={line.productId} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {displayQuantity(line.sent)} {unitLabels[line.unit]}
                  </TableCell>
                  <TableCell>
                    <Input
                      name={`received:${line.productId}`}
                      defaultValue={displayQuantity(line.sent)}
                      inputMode="decimal"
                      aria-label={`${line.code} gelen miktar`}
                      className="w-28"
                      required
                    />
                  </TableCell>
                  <TableCell>
                    <select name={`lossReason:${line.productId}`} className={selectClassName} aria-label={`${line.code} eksik nedeni`}>
                      <option value="">—</option>
                      {Object.entries(lossReasonLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StockForm>
      ) : (
        <Table className="max-w-3xl">
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead className="text-right">Gönderilen</TableHead>
              <TableHead className="text-right">Gelen</TableHead>
              <TableHead className="text-right">Eksik</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {found.lines.map((line) => (
              <TableRow key={line.productId}>
                <TableCell>
                  <span className="font-mono">{line.code}</span> {line.name}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {displayQuantity(line.sent)} {unitLabels[line.unit]}
                </TableCell>
                <TableCell className="text-right tabular-nums">{line.received === null ? "—" : displayQuantity(line.received)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.lost && line.lost !== "0"
                    ? `${displayQuantity(line.lost)} (${lossReasonLabels[line.lossReason!]})`
                    : line.lost === null
                      ? "—"
                      : "0"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
