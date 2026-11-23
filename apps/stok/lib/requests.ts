import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { notification, quoteRequest, requestStatus, user } from "../db/schema";
import { logActivity } from "./activity";
import { parseInput, UserError } from "./errors";
import { appUrl, invoiceReminderTo } from "./finance-reminders";
import { requirePermission } from "./guard";
import { requestStatusLabels } from "./request-status";

// Talepler: quote requests from the ferritnuve.com form. Each lands here and in the company inbox.

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

const requestInput = z.object({
  name: z.string().trim().min(2, { error: "Ad veya firma gerekli." }).max(200),
  contact: z.string().trim().min(5, { error: "E-posta veya telefon gerekli." }).max(200),
  message: z.string().trim().min(5, { error: "İhtiyacınızı yazın." }).max(4000),
  subject: optional(300),
  productCode: optional(100),
  pageUrl: optional(1000),
  locale: z.enum(["tr", "en"]).default("tr"),
  photoUrl: optional(1000),
});
export type RequestInput = z.input<typeof requestInput>;

export function requestEmail(r: z.output<typeof requestInput>) {
  return {
    subject: `Siteden teklif talebi: ${r.name}${r.subject ? ` (${r.subject})` : ""}`,
    body: [
      `Kimden: ${r.name}`,
      `İletişim: ${r.contact}`,
      r.subject && `Konu: ${r.subject}${r.productCode ? ` (Kod: ${r.productCode})` : ""}`,
      "",
      "İhtiyaç:",
      r.message,
      "",
      r.photoUrl && `Fotoğraf: ${r.photoUrl}`,
      r.pageUrl && `Yazdığı sayfa: ${r.pageUrl}`,
      r.locale === "en" && "Ziyaretçi İngilizce sayfadan yazdı.",
      "",
      `Yanıtlayınca işaretleyin: ${appUrl()}/musteriler/talepler`,
    ]
      .filter((line) => line !== undefined && line !== false)
      .join("\n"),
  };
}

// Saves the request, logs it and queues the email to the company inbox, all or nothing.
export async function createRequest(input: RequestInput) {
  const data = parseInput(requestInput, input);
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(quoteRequest).values(data).returning({ id: quoteRequest.id });
    await logActivity(tx, { entity: "talep", entityId: row.id, label: data.name, action: "eklendi", detail: data.subject ?? null, userId: null, via: "site" });
    await tx.insert(notification).values({ kind: "site_talebi", ...requestEmail(data), recipients: [invoiceReminderTo] });
    return row.id;
  });
}

export async function listRequests() {
  return db
    .select({
      id: quoteRequest.id,
      name: quoteRequest.name,
      contact: quoteRequest.contact,
      message: quoteRequest.message,
      subject: quoteRequest.subject,
      productCode: quoteRequest.productCode,
      pageUrl: quoteRequest.pageUrl,
      locale: quoteRequest.locale,
      photoUrl: quoteRequest.photoUrl,
      status: quoteRequest.status,
      statusBy: user.name,
      statusAt: quoteRequest.statusAt,
      createdAt: quoteRequest.createdAt,
    })
    .from(quoteRequest)
    .leftJoin(user, eq(user.id, quoteRequest.statusBy))
    .orderBy(desc(quoteRequest.createdAt))
    .limit(500);
}

const statusInput = z.object({ id: z.uuid(), status: z.enum(requestStatus.enumValues, { error: "Durum seçin." }) });

export async function setRequestStatus(headers: Headers, input: z.input<typeof statusInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(statusInput, input);
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(quoteRequest).where(eq(quoteRequest.id, data.id)).for("update");
    if (!row) throw new UserError("Talep bulunamadı.");
    if (row.status === data.status) return;
    await tx.update(quoteRequest).set({ status: data.status, statusBy: actor.userId, statusAt: new Date() }).where(eq(quoteRequest.id, data.id));
    await logActivity(tx, { entity: "talep", entityId: row.id, label: row.name, action: "duzenlendi", detail: `${requestStatusLabels[row.status]} → ${requestStatusLabels[data.status]}`, userId: actor.userId });
  });
}
