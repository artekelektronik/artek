import { headers } from "next/headers";
import { Badge } from "@artek/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { NoAccess } from "@/components/no-access";
import { loadActor } from "@/lib/guard";
import { formatDateTime, notificationStatusLabels } from "@/lib/labels";
import { gaveUp, getRecipientRoles, listNotifications } from "@/lib/outbox";
import { can } from "@/lib/permissions";
import { SendNowButton } from "./send-now-button";
import { RecipientsForm } from "./recipients-form";

export const metadata = { title: "Bildirimler | Artek Stok" };

export default async function NotificationsPage() {
  const requestHeaders = await headers();
  if (!can(await loadActor(requestHeaders), "notifications.manage")) return <NoAccess />;
  const [roles, notifications] = await Promise.all([getRecipientRoles(requestHeaders), listNotifications(requestHeaders)]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Bildirimler</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Kritik seviye uyarısını alanlar</h2>
        <p className="text-muted-foreground text-sm">
          Bir ürünün şirket toplamı kritik seviyenin altına indiğinde bu rollerdeki herkese bir e-posta gider.
        </p>
        <RecipientsForm roles={roles} />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Gönderilen e-postalar</h2>
          <SendNowButton />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Oluşma</TableHead>
              <TableHead>Konu</TableHead>
              <TableHead>Alıcılar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Deneme</TableHead>
              <TableHead>Son hata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(n.createdAt)}</TableCell>
                <TableCell>{n.subject}</TableCell>
                <TableCell className="max-w-56 truncate text-sm">{n.recipients.join(", ")}</TableCell>
                <TableCell>
                  <Badge variant={n.status === "sent" ? "secondary" : n.status === "failed" ? "destructive" : "default"}>
                    {gaveUp(n) ? "Gönderilemedi · vazgeçildi" : notificationStatusLabels[n.status]}
                  </Badge>
                  {n.sentAt && <span className="text-muted-foreground ml-2 text-xs">{formatDateTime(n.sentAt)}</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{n.attempts}</TableCell>
                <TableCell className="text-destructive max-w-64 truncate text-sm">{n.lastError}</TableCell>
              </TableRow>
            ))}
            {notifications.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Henüz bildirim yok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
