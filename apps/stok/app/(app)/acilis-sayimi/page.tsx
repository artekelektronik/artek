import { headers } from "next/headers";
import Link from "next/link";
import { Badge } from "@artek/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { listCounts } from "@/lib/counts";
import { loadActor } from "@/lib/guard";
import { countStatusLabels, formatDateTime } from "@/lib/labels";
import { listLokasyon } from "@/lib/lokasyon";
import { can } from "@/lib/permissions";
import { OpenCountForm } from "../sayim/open-count-form";

export const metadata = { title: "Açılış sayımı | Artek" };

export default async function OpeningCountPage() {
  const requestHeaders = await headers();
  const [actor, lokasyon, counts] = await Promise.all([loadActor(requestHeaders), listLokasyon(), listCounts(requestHeaders)]);
  const notOpened = lokasyon.filter((l) => !l.openedAt && can(actor, "count.perform", l.id));
  const openings = counts.filter((c) => c.kind === "acilis");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Açılış sayımı</h1>
      <p className="text-muted-foreground max-w-3xl text-sm">
        Sistem bir Lokasyonda açılış sayımı onaylanınca başlar: sayılan miktarlar açılış stoku olur. Onaydan önce o Lokasyonda başka
        hareket kaydedilemez; her Lokasyonun tek bir onaylı açılış sayımı olur.
      </p>

      <Table className="max-w-xl">
        <TableHeader>
          <TableRow>
            <TableHead>Lokasyon</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lokasyon.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.name}</TableCell>
              <TableCell>
                {l.openedAt ? (
                  <Badge variant="secondary">Açıldı · {formatDateTime(l.openedAt)}</Badge>
                ) : (
                  <Badge>Açılış sayımı bekleniyor</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {notOpened.length > 0 && <OpenCountForm lokasyon={notOpened} categories={[]} kind="acilis" />}

      {openings.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Açılış sayımları</h2>
          <Table className="max-w-3xl">
            <TableHeader>
              <TableRow>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Lokasyon</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Açan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openings.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/sayim/${c.id}`} className="underline-offset-4 hover:underline">
                      {formatDateTime(c.createdAt)}
                    </Link>
                  </TableCell>
                  <TableCell>{c.lokasyonName}</TableCell>
                  <TableCell>{countStatusLabels[c.status]}</TableCell>
                  <TableCell>{c.createdBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}
