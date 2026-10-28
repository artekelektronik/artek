// One-time: fills customers' business contact routes from the research file kept outside the repo.
// Usage: pnpm --filter stok import-crm-contacts /path/to/iletisim.json   (run after the invoices are uploaded)
// The file is customer data and is never committed. The Müşteriler page can load the same file.
import { readFileSync } from "node:fs";
import { db } from "../db";
import { importContacts } from "../lib/contact-import";

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
