import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { customer } from "../db/schema";
import { parseInput } from "./errors";
import { requirePermission } from "./guard";

// Business contact routes researched outside the app (iletisim.json), loaded onto customers by VKN.
// Only empty fields are filled, so nothing typed on a customer card is overwritten; weak matches are skipped.

export type ContactRecord = {
  id: string; // the customer's VKN
  web?: string;
  telefon?: string;
  eposta?: string;
  kaynak?: string;
  guven?: "yuksek" | "orta" | "dusuk";
  ne_yapiyor?: string;
};

const value = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export async function importContacts(records: ContactRecord[]) {
  let updated = 0;
  let skipped = 0;
  for (const r of records) {
    // A weak match is not used: a wrong phone is worse than none.
    if (r.guven === "dusuk" || !(value(r.telefon) || value(r.eposta) || value(r.web))) {
      skipped++;
      continue;
    }
    const source = value(r.kaynak) ? `${r.kaynak}${r.guven === "orta" ? " (eşleşme kesin değil, doğrulayın)" : ""}` : null;
    const rows = await db
      .update(customer)
      .set({
        phone: sql`coalesce(${customer.phone}, ${value(r.telefon)})`,
        email: sql`coalesce(${customer.email}, ${value(r.eposta)})`,
        website: sql`coalesce(${customer.website}, ${value(r.web)})`,
        about: sql`coalesce(${customer.about}, ${value(r.ne_yapiyor)})`,
        contactSource: sql`coalesce(${customer.contactSource}, ${source})`,
        updatedAt: new Date(),
      })
      .where(and(eq(customer.taxId, String(r.id)), eq(customer.taxIdType, "VKN")))
      .returning({ id: customer.id });
    if (rows.length) updated++;
    else skipped++;
  }
  return { updated, skipped };
}

const recordsInput = z.array(
  z.object({
    id: z.union([z.string(), z.number()]).transform(String),
    web: z.string().optional(),
    telefon: z.string().optional(),
    eposta: z.string().optional(),
    kaynak: z.string().optional(),
    guven: z.enum(["yuksek", "orta", "dusuk"]).optional(),
    ne_yapiyor: z.string().optional(),
  }),
  { error: "Dosya beklenen biçimde değil: iletişim kayıtlarının listesi olmalı." },
);

// The Müşteriler page's "İletişim bilgilerini yükle".
export async function importContactsFile(headers: Headers, records: unknown) {
  await requirePermission(headers, "crm.edit");
  return importContacts(parseInput(recordsInput, records));
}
