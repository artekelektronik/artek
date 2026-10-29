import { createHash } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { extractText, getDocumentProxy } from "unpdf";
import { db } from "../db";
import { customer, invoice, invoiceLine } from "../db/schema";
import { recordChanges } from "./customer-changes";
import { requirePermission } from "./guard";
import { missingNumbers } from "./finance-calc";
import { InvoiceParseError, parseInvoiceText, productGroup, productName } from "./invoice-parse";

export type ImportResult =
  | { status: "eklendi"; number: string; customer: string; issuedOn: string }
  | { status: "tekrar"; number: string; customer: string; issuedOn: string }
  | { status: "okunamadi"; reason: string };

export async function pdfText(bytes: Uint8Array) {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

// One PDF in: a new invoice, a repeat of one already here (same ETTN), or a reason it could not be read.
export async function importInvoiceText(headers: Headers, input: { fileName: string; text: string; sha256: string }): Promise<ImportResult> {
  const actor = await requirePermission(headers, "finance.edit");
  let parsed;
  try {
    parsed = parseInvoiceText(input.text);
  } catch (error) {
    if (error instanceof InvoiceParseError) return { status: "okunamadi", reason: error.message };
    throw error;
  }
  const { buyer } = parsed;

  return db.transaction(async (tx) => {
    const [before] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.taxId, buyer.taxId));
    // The newest invoice's name and address win, so a renamed company shows its current name; the old one goes
    // into the change history.
    const [c] = await tx
      .insert(customer)
      .values({ taxId: buyer.taxId, taxIdType: buyer.taxIdType, name: buyer.name, city: buyer.city, district: buyer.district, email: buyer.email })
      .onConflictDoUpdate({
        target: customer.taxId,
        set: {
          name: sql`case when excluded.name <> '' then excluded.name else ${customer.name} end`,
          city: sql`case when excluded.city <> '' then excluded.city else ${customer.city} end`,
          district: sql`case when excluded.district <> '' then excluded.district else ${customer.district} end`,
          email: sql`coalesce(${customer.email}, excluded.email)`,
        },
        setWhere: sql`${customer.id} not in (select customer_id from invoice where issued_on > ${parsed.issuedOn})`,
      })
      .returning({ id: customer.id, name: customer.name });
    const customerRow = c ?? (await tx.select({ id: customer.id, name: customer.name }).from(customer).where(eq(customer.taxId, buyer.taxId)))[0];
    if (before) await recordChanges(tx, customerRow.id, { name: before.name }, { name: customerRow.name }, { source: "fatura" });

    const [added] = await tx
      .insert(invoice)
      .values({
        ettn: parsed.ettn,
        number: parsed.number,
        issuedOn: parsed.issuedOn,
        scenario: parsed.scenario,
        type: parsed.type,
        customerId: customerRow.id,
        netAmount: parsed.netAmount.toFixed(2),
        totalAmount: parsed.totalAmount.toFixed(2),
        fileName: input.fileName,
        fileSha256: input.sha256,
        rawText: input.text,
        uploadedBy: actor.userId,
      })
      .onConflictDoNothing({ target: invoice.ettn })
      .returning({ id: invoice.id });
    const summary = { number: parsed.number, customer: customerRow.name, issuedOn: parsed.issuedOn };
    if (!added) return { status: "tekrar" as const, ...summary };

    if (parsed.lines.length) {
      await tx.insert(invoiceLine).values(
        parsed.lines.map((line, i) => ({
          invoiceId: added.id,
          seq: i + 1,
          description: line.description,
          productName: productName(line.description),
          productGroup: productGroup(line.description),
          quantity: String(line.quantity),
          unit: line.unit,
          unitPrice: String(line.unitPrice),
          amount: line.amount.toFixed(2),
        })),
      );
    }
    return { status: "eklendi" as const, ...summary };
  });
}

export async function importInvoicePdf(headers: Headers, input: { fileName: string; bytes: Uint8Array }) {
  await requirePermission(headers, "finance.edit");
  const sha256 = createHash("sha256").update(input.bytes).digest("hex");
  let text: string;
  try {
    text = await pdfText(input.bytes);
  } catch {
    return { status: "okunamadi", reason: "Dosya PDF olarak açılamadı." } satisfies ImportResult;
  }
  return importInvoiceText(headers, { fileName: input.fileName, text, sha256 });
}

export async function invoiceList(headers: Headers) {
  await requirePermission(headers, "finance.view");
  const rows = await db
    .select({
      id: invoice.id,
      number: invoice.number,
      scenario: invoice.scenario,
      type: invoice.type,
      issuedOn: invoice.issuedOn,
      netAmount: invoice.netAmount,
      customerId: invoice.customerId,
      customer: customer.name,
      uploadedAt: invoice.uploadedAt,
    })
    .from(invoice)
    .innerJoin(customer, eq(customer.id, invoice.customerId))
    .orderBy(desc(invoice.issuedOn), desc(invoice.number));
  const lastUpload = rows.reduce<Date | null>((m, r) => (!m || r.uploadedAt > m ? r.uploadedAt : m), null);
  return { rows, lastUpload, gaps: missingNumbers(rows) };
}
