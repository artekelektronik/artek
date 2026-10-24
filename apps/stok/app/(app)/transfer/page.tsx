import { headers } from "next/headers";
import Link from "next/link";
import { Badge } from "@artek/ui/components/badge";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { ProductLines } from "@/components/product-lines";
import { StockForm } from "@/components/stock-form";
import { loadActor } from "@/lib/guard";
import { formatDateTime } from "@/lib/labels";
import { listLokasyon } from "@/lib/lokasyon";
import { activeProducts, lokasyonFor } from "@/lib/pickers";
import { listTransfers } from "@/lib/transfers";
import { selectClassName } from "@/lib/ui";
import { sendTransferAction } from "./actions";

export const metadata = { title: "Transfer | Artek Stok" };

export default async function TransfersPage() {
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  const [sources, targets, products, transfers] = await Promise.all([
    lokasyonFor(actor, "stock.transfer"),
    listLokasyon(),
    activeProducts(),
    listTransfers(requestHeaders),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Transfer</h1>

      {sources.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Yeni sevk</h2>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Sevk edilen miktar kaynaktan hemen düşer ve teslim alınana kadar yolda görünür; iki Lokasyonda da sayılmaz.
          </p>
          <StockForm action={sendTransferAction} submitLabel="Sevk et" savedMessage="Sevk kaydedildi; ürünler yolda.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Label className="flex-col items-stretch gap-1">
                Kaynak
                <select name="fromLokasyonId" className={`${selectClassName} w-full font-normal`} required>
                  {sources.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Label>
              <Label className="flex-col items-stretch gap-1">
                Hedef
                <select
                  name="toLokasyonId"
                  defaultValue={targets.find((t) => t.id !== sources[0].id)?.id}
                  className={`${selectClassName} w-full font-normal`}
                  required
                >
                  {targets.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Label>
              <Label className="flex-col items-stretch gap-1">
                Not (isteğe bağlı)
                <Input name="note" className="font-normal" />
              </Label>
            </div>
            <ProductLines products={products} />
          </StockForm>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Transferler</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sevk</TableHead>
              <TableHead>Kaynak → Hedef</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Sevk eden</TableHead>
              <TableHead>Teslim alan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link href={`/transfer/${t.id}`} className="underline-offset-4 hover:underline">
                    {formatDateTime(t.sentAt)}
                  </Link>
                </TableCell>
                <TableCell>
                  {t.fromName} → {t.toName}
                </TableCell>
                <TableCell>
                  {t.status === "yolda" ? <Badge>Yolda</Badge> : <Badge variant="secondary">Teslim alındı</Badge>}
                </TableCell>
                <TableCell>{t.sentBy}</TableCell>
                <TableCell>{t.receivedBy ? `${t.receivedBy} · ${formatDateTime(t.receivedAt!)}` : ""}</TableCell>
              </TableRow>
            ))}
            {transfers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  Transfer yok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
