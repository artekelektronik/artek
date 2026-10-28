import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { Table, TableBody, TableCell, TableRow } from "@artek/ui/components/table";
import { NoAccess } from "@/components/no-access";
import { PriorityBadge } from "@/components/priority-badge";
import { customerCard } from "@/lib/crm";
import { day, financeSummary, loyalty, recency, tl } from "@/lib/finance";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { formatIstanbulTime } from "@/lib/time";
import { CustomerForm, NoteForm } from "./customer-form";

export const metadata = { title: "Müşteri | Artek Stok" };

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "crm.view")) return <NoAccess />;
  const canEdit = can(actor, "crm.edit");
  const { id } = await params;
  const [c, s] = await Promise.all([customerCard(requestHeaders, id), financeSummary(requestHeaders, "crm.view")]);
  if (!c) notFound();
  const stats = s.byCustomer.get(c.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href={`/musteriler?secili=${c.id}`} className="text-muted-foreground text-sm underline-offset-4 hover:underline">
          ← Müşteriler
        </Link>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-balance">{c.name}</h1>
        <p className="text-muted-foreground text-sm">
          {[c.district, c.city].filter(Boolean).join(" / ")} · {c.taxIdType === "TCKN" ? "Şahıs firması" : "Şirket"}
        </p>
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PriorityBadge no={stats.no} /> Ne konuşulur
            </CardTitle>
            <CardDescription className="text-foreground text-base">{stats.talk}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Fact label="Satış (KDV hariç)">{tl(stats.sales)}</Fact>
            <Fact label="Sıra">{stats.rank}.</Fact>
            <Fact label="Fatura · sipariş günü">
              {stats.invoices} · {stats.orderDays}
            </Fact>
            <Fact label="İlk – son alım">
              {day(stats.firstOn)} – {day(stats.lastOn)}
            </Fact>
            <Fact label="Durum">
              {loyalty(stats.orderDays)}, {recency(stats.idle).toLocaleLowerCase("tr")}
            </Fact>
            <Fact label="Aldığı gruplar">{stats.groups.join(", ")}</Fact>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>İletişim ve takip</CardTitle>
            <CardDescription>
              Firmanın kendi sitesinden veya resmi rehberden alın; tahmini e-posta yazmayın.
              {c.taxIdType === "TCKN" && " Şahıs firması: yalnızca sizin kayıtlarınızdaki bilgiyi girin."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <CustomerForm customer={c} />
            ) : (
              <p className="text-muted-foreground text-sm">Bu müşteriyi düzenleme izniniz yok; yalnızca görüntüleyebilirsiniz.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notlar</CardTitle>
            <CardDescription>Her görüşmeden sonra kısa bir not. Notlar silinmez.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {canEdit && <NoteForm customerId={c.id} />}
            {c.notes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Henüz not yok.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {c.notes.map((n) => (
                  <li key={n.id} className="border-l-2 pl-3">
                    <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                    <p className="text-muted-foreground text-xs">
                      {n.author} · {formatIstanbulTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faturalar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {c.invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="tabular-nums">{day(i.issuedOn)}</TableCell>
                  <TableCell className="tabular-nums">{i.number}</TableCell>
                  <TableCell>{i.type === "IADE" ? "İade" : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{tl(Number(i.netAmount))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
