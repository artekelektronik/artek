import { and, eq, gt, isNull, max } from "drizzle-orm";
import { db } from "../db";
import { invoice, notification, user, userPanel, userRole } from "../db/schema";
import { followUpsDue } from "./crm";
import { formatIstanbulTime, istanbulDate } from "./time";

// The shared company inbox the owner reads; invoices are uploaded from there.
export const invoiceReminderTo = "artek@ferritnuve.com";
export const invoiceReminderDays = 7;
const dayMs = 86_400_000;
const appUrl = () => process.env.BETTER_AUTH_URL ?? "https://stok.ferritnuve.com";

async function sentSince(kind: string, since: Date) {
  const [row] = await db
    .select({ id: notification.id })
    .from(notification)
    .where(and(eq(notification.kind, kind), gt(notification.createdAt, since)))
    .limit(1);
  return Boolean(row);
}

// Run by the daily cron before the outbox is sent; each check queues at most one email per period.
export async function queueFinanceReminders(now = new Date()) {
  const queued: string[] = [];

  // No new invoice for a week: remind, then again every week until one is uploaded.
  const [{ last }] = await db.select({ last: max(invoice.uploadedAt) }).from(invoice);
  const quietSince = last ? new Date(last) : null;
  const threshold = new Date(now.getTime() - invoiceReminderDays * dayMs);
  // One hour of slack so a cron that runs a little early still counts as a week.
  if ((!quietSince || quietSince < threshold) && !(await sentSince("fatura_hatirlatma", new Date(threshold.getTime() + 60 * 60_000)))) {
    const days = quietSince ? Math.floor((now.getTime() - quietSince.getTime()) / dayMs) : null;
    await db.insert(notification).values({
      createdAt: now,
      kind: "fatura_hatirlatma",
      subject: days === null ? "Henüz fatura yüklenmedi" : `${days} gündür fatura yüklenmedi`,
      body: [
        days === null
          ? "Artek Stok'a henüz hiç fatura yüklenmedi."
          : `Artek Stok'a en son ${formatIstanbulTime(quietSince!)} tarihinde fatura yüklendi.`,
        "",
        "QNB Dijital Köprü'de kesilen yeni faturaların PDF'lerini indirip yükleyin; finans paneli ve müşteri listesi kendiliğinden güncellenir.",
        "Aynı faturayı tekrar yüklemek sorun olmaz, ikinci kez eklenmez.",
        "",
        `Yükleme ekranı: ${appUrl()}/faturalar`,
      ].join("\n"),
      recipients: [invoiceReminderTo],
    });
    queued.push("fatura_hatirlatma");
  }

  // Customers whose follow-up date has come: one list a day to admins who hold the Müşteri paneli.
  const today = istanbulDate(now);
  const due = await followUpsDue(today);
  if (due.length && !(await sentSince("crm_takip", new Date(now.getTime() - 20 * 60 * 60_000)))) {
    const admins = await db
      .selectDistinct({ email: user.email })
      .from(user)
      .innerJoin(userRole, and(eq(userRole.userId, user.id), eq(userRole.role, "admin")))
      .innerJoin(userPanel, and(eq(userPanel.userId, user.id), eq(userPanel.panel, "musteri")))
      .where(isNull(user.deactivatedAt));
    const recipients = admins.map((a) => a.email).sort();
    await db.insert(notification).values({
      ...(recipients.length === 0 && { status: "failed" as const, lastError: "Alıcı yok: Müşteri paneli izni olan etkin yönetici bulunmuyor." }),
      createdAt: now,
      kind: "crm_takip",
      subject: `Bugün takip edilecek ${due.length} müşteri`,
      body: [
        "Takip tarihi gelen müşteriler:",
        "",
        ...due.map((c) => `- ${c.name}${c.phone ? ` · ${c.phone}` : ""} (takip: ${c.nextFollowUpOn})\n  ${appUrl()}/musteriler/${c.id}`),
      ].join("\n"),
      recipients,
    });
    queued.push("crm_takip");
  }
  return queued;
}
