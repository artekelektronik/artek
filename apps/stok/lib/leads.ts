import { desc, eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { customer, lead, leadEvent, leadStatus, user, type LeadSource } from "../db/schema";
import { parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";
import { logActivity } from "./activity";
import { normFirm } from "./lead-match";
import { leadStatusLabels } from "./lead-status";

// Adaylar: firms the sales routines found, kept next to Müşteriler so who was contacted and what happened is tracked.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];


const optional = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => v || undefined);

// The shape the routines send (Turkish keys, as in their reports).
const reportInput = z.object({
  rapor: z.string().trim().min(1, { error: "Rapor adı gerekli." }).max(200),
  adaylar: z
    .array(
      z.object({
        firma: z.string().trim().min(2).max(300),
        sehir: optional,
        sektor: optional,
        web: optional,
        neden: z.string().trim().max(2000).optional(),
        vkn: z
          .string()
          .trim()
          .regex(/^\d{10,11}$/)
          .optional(),
        kaynaklar: z
          .array(z.object({ baslik: z.string().trim().max(300), url: z.string().trim().max(1000), tarih: optional }))
          .max(20)
          .default([]),
        iletisim: z.object({ telefon: optional, eposta: optional, form: optional, linkedin: optional }).optional(),
      }),
    )
    .max(100),
});

// Adds new Adaylar and marks repeats as seen again; firms that are already Müşteriler are left out.
export async function importLeads(input: z.input<typeof reportInput>, by: { userId: string | null }) {
  const data = parseInput(reportInput, input);
  const customers = await db.select({ name: customer.name, taxId: customer.taxId }).from(customer);
  const customerNames = new Set(customers.map((c) => normFirm(c.name)));
  const customerTaxIds = new Set(customers.map((c) => c.taxId));
  const today = new Date().toISOString().slice(0, 10);
  const counts = { added: 0, seen: 0, customers: 0, skipped: 0 };

  await db.transaction(async (tx) => {
    for (const a of data.adaylar) {
      const normName = normFirm(a.firma);
      if (normName.length < 2) {
        counts.skipped++;
        continue;
      }
      if (customerNames.has(normName) || (a.vkn && customerTaxIds.has(a.vkn))) {
        counts.customers++;
        continue;
      }
      const source: LeadSource = { report: data.rapor, at: today, links: a.kaynaklar.map((k) => ({ title: k.baslik, url: k.url, date: k.tarih })) };
      const contact = { phone: a.iletisim?.telefon, email: a.iletisim?.eposta, form: a.iletisim?.form, linkedin: a.iletisim?.linkedin };
      const [existing] = await tx.select().from(lead).where(eq(lead.normName, normName));
      if (existing) {
        if (existing.sources.some((s) => s.report === data.rapor)) continue; // the same report sent twice
        await tx
          .update(lead)
          .set({
            website: existing.website ?? a.web ?? null,
            city: existing.city ?? a.sehir ?? null,
            sector: existing.sector ?? a.sektor ?? null,
            taxId: existing.taxId ?? a.vkn ?? null,
            why: a.neden || existing.why,
            contact: { ...Object.fromEntries(Object.entries(contact).filter(([, v]) => v)), ...existing.contact },
            sources: [...existing.sources, source],
            seenCount: existing.seenCount + 1,
            lastSeenAt: new Date(),
          })
          .where(eq(lead.id, existing.id));
        await tx.insert(leadEvent).values({ leadId: existing.id, kind: "gorundu", text: `Tekrar görüldü: ${data.rapor}`, userId: by.userId });
        counts.seen++;
      } else {
        const [row] = await tx
          .insert(lead)
          .values({
            name: a.firma,
            normName,
            website: a.web ?? null,
            city: a.sehir ?? null,
            sector: a.sektor ?? null,
            why: a.neden || null,
            taxId: a.vkn ?? null,
            contact: Object.fromEntries(Object.entries(contact).filter(([, v]) => v)),
            sources: [source],
          })
          .returning({ id: lead.id });
        await tx.insert(leadEvent).values({ leadId: row.id, kind: "eklendi", text: `Eklendi: ${data.rapor}`, userId: by.userId });
        await logActivity(tx, { entity: "aday", entityId: row.id, label: a.firma, action: "eklendi", detail: data.rapor, userId: by.userId, via: by.userId ? null : "rutin" });
        counts.added++;
      }
    }
  });
  return counts;
}

// The Adaylar page's "Adayları yükle".
export async function importLeadsFile(headers: Headers, records: unknown) {
  const actor = await requirePermission(headers, "crm.edit");
  return importLeads(records as z.input<typeof reportInput>, { userId: actor.userId });
}

export async function listLeads() {
  return db.select().from(lead).orderBy(desc(lead.lastSeenAt));
}

export async function leadEvents(headers: Headers, leadId: string) {
  await requirePermission(headers, "crm.view");
  return db
    .select({ id: leadEvent.id, kind: leadEvent.kind, text: leadEvent.text, author: user.name, createdAt: leadEvent.createdAt })
    .from(leadEvent)
    .leftJoin(user, eq(user.id, leadEvent.userId))
    .where(eq(leadEvent.leadId, leadId))
    .orderBy(desc(leadEvent.createdAt));
}

const statusInput = z.object({
  id: z.uuid(),
  status: z.enum(leadStatus.enumValues, { error: "Durum seçin." }).refine((s) => s !== "musteri_oldu", {
    error: "Müşteri oldu, Müşteri bağlanınca kendiliğinden işaretlenir.",
  }),
  note: z.string().trim().max(2000).default(""),
});

// A status change and its note, each kept as an event with who and when.
export async function updateLead(headers: Headers, input: z.input<typeof statusInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(statusInput, input);
  const [l] = await db.select().from(lead).where(eq(lead.id, data.id));
  if (!l) throw new UserError("Aday bulunamadı.");
  await db.transaction(async (tx) => {
    if (l.status !== data.status) {
      await tx.update(lead).set({ status: data.status }).where(eq(lead.id, l.id));
      await tx.insert(leadEvent).values({
        leadId: l.id,
        kind: "durum",
        text: `${leadStatusLabels[l.status]} → ${leadStatusLabels[data.status]}`,
        userId: actor.userId,
      });
    }
    if (data.note) await tx.insert(leadEvent).values({ leadId: l.id, kind: "not", text: data.note, userId: actor.userId });
    const detail = [l.status !== data.status && `${leadStatusLabels[l.status]} → ${leadStatusLabels[data.status]}`, data.note && "not eklendi"].filter(Boolean).join(", ");
    if (detail) await logActivity(tx, { entity: "aday", entityId: l.id, label: l.name, action: "duzenlendi", detail, userId: actor.userId });
  });
}

async function markCustomer(tx: Tx, leadId: string, c: { id: string; name: string }, userId: string | null) {
  const [l] = await tx.update(lead).set({ customerId: c.id, status: "musteri_oldu" }).where(eq(lead.id, leadId)).returning({ name: lead.name });
  await logActivity(tx, { entity: "aday", entityId: leadId, label: l.name, action: "musteri_oldu", detail: c.name, userId, via: userId ? null : "fatura" });
  await tx.insert(leadEvent).values({ leadId, kind: "musteri", text: `Müşteri oldu: ${c.name}`, userId });
}

// A person confirms that an Aday is this Müşteri (the page suggests one by name).
export async function linkLeadToCustomer(headers: Headers, leadId: string, customerId: string) {
  const actor = await requirePermission(headers, "crm.edit");
  const [l] = await db.select().from(lead).where(eq(lead.id, leadId));
  if (!l) throw new UserError("Aday bulunamadı.");
  if (l.customerId) throw new UserError("Bu aday zaten bir müşteriye bağlı.");
  const [c] = await db.select({ id: customer.id, name: customer.name }).from(customer).where(eq(customer.id, customerId));
  if (!c) throw new UserError("Müşteri bulunamadı.");
  await db.transaction((tx) => markCustomer(tx, l.id, c, actor.userId));
}

// Invoice import: an Aday whose VKN is known becomes that Müşteri's as soon as its first invoice arrives.
export async function linkLeadsByTaxId(tx: Tx, taxId: string, c: { id: string; name: string }) {
  const found = await tx.select({ id: lead.id }).from(lead).where(and(eq(lead.taxId, taxId), isNull(lead.customerId)));
  for (const l of found) await markCustomer(tx, l.id, c, null);
}

const newLeadInput = z.object({
  name: z.string().trim().min(2, { error: "Firma adını yazın." }).max(300),
  website: z.string().trim().max(500).default(""),
  city: z.string().trim().max(100).default(""),
  sector: z.string().trim().max(200).default(""),
  why: z.string().trim().max(2000).default(""),
  phone: z.string().trim().max(100).default(""),
  email: z.string().trim().max(200).default(""),
  taxId: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{10,11}$/.test(v), { error: "VKN 10, TCKN 11 haneli olmalı." })
    .default(""),
});

// An Aday added by hand. A firm that is already an Aday or a Müşteri is refused with its name. Returns the new id.
export async function addLead(headers: Headers, input: z.input<typeof newLeadInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(newLeadInput, input);
  const normName = normFirm(data.name);
  if (normName.length < 2) throw new UserError("Firma adını yazın.");
  const customers = await db.select({ name: customer.name, taxId: customer.taxId }).from(customer);
  const asCustomer = customers.find((c) => normFirm(c.name) === normName || (data.taxId && c.taxId === data.taxId));
  if (asCustomer) throw new UserError(`Bu firma zaten müşterimiz: ${asCustomer.name}.`);
  const [existing] = await db.select({ name: lead.name }).from(lead).where(eq(lead.normName, normName));
  if (existing) throw new UserError(`Bu firma zaten Adaylar'da: ${existing.name}.`);
  const contact = Object.fromEntries(Object.entries({ phone: data.phone, email: data.email }).filter(([, v]) => v));
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(lead)
      .values({
        name: data.name,
        normName,
        website: data.website || null,
        city: data.city || null,
        sector: data.sector || null,
        why: data.why || null,
        taxId: data.taxId || null,
        contact,
        sources: [{ report: "Elle eklendi", at: new Date().toISOString().slice(0, 10), links: [] }],
      })
      .returning({ id: lead.id });
    await tx.insert(leadEvent).values({ leadId: row.id, kind: "eklendi", text: "Elle eklendi", userId: actor.userId });
    await logActivity(tx, { entity: "aday", entityId: row.id, label: data.name, action: "eklendi", detail: "Elle", userId: actor.userId });
    return row.id;
  });
}
