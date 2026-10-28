// One-time: fills customers' business contact routes from the research file kept outside the repo.
// Usage: pnpm --filter stok import-crm-contacts /path/to/iletisim.json   (run after the invoices are uploaded)
// The file is customer data and is never committed. Fields already filled in on a customer card are kept.
import { readFileSync } from "node:fs";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { customer } from "../db/schema";

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

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Kullanım: pnpm --filter stok import-crm-contacts <iletisim.json>");
    process.exit(1);
  }
  const result = await importContacts(JSON.parse(readFileSync(file, "utf8")));
  console.log(`İletişim aktarımı: ${result.updated} müşteri güncellendi, ${result.skipped} atlandı.`);
  await db.$client.end();
}

if (require.main === module) {
  main().catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await db.$client.end();
    process.exit(1);
  });
}
