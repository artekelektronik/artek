import { headers } from "next/headers";
import { NoAccess } from "@/components/no-access";
import { loadActor } from "@/lib/guard";
import { notificationStatusLabels } from "@/lib/labels";
import { gaveUp, getRecipientRoles, listNotifications } from "@/lib/outbox";
import { can } from "@/lib/permissions";
import { SendNowButton } from "./send-now-button";
import { NotificationsTable } from "./notifications-table";
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
        <NotificationsTable
          notifications={notifications.map((n) => ({
            id: n.id,
            createdAt: n.createdAt,
            subject: n.subject,
            recipients: n.recipients,
            status: n.status,
            statusLabel: gaveUp(n) ? "Gönderilemedi · vazgeçildi" : notificationStatusLabels[n.status],
            sentAt: n.sentAt,
            attempts: n.attempts,
            lastError: n.lastError,
          }))}
        />
      </section>
    </div>
  );
}
