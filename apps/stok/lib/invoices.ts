import { createHash } from "node:crypto";
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { extractText, getDocumentProxy } from "unpdf";
import { db, type Tx } from "../db";
import { customer, invoice, invoiceFile, invoiceLine, lokasyon, product, user } from "../db/schema";
import { logActivity } from "./activity";
import { restoreCustomerIn, restoreInvoiceIn } from "./archive";
import { recordChanges } from "./customer-changes";
import { isUuid, parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";
import { matchCustomer, matchProduct } from "./invoice-match";
import { postDocumentIn } from "./ledger";
import { can } from "./permissions";
import { istanbulDate } from "./time";
import { linkLeadsByTaxId } from "./leads";
import { missingNumbers } from "./finance-calc";
import { InvoiceParseError, parseInvoiceText, productGroup, productName } from "./invoice-parse";

export type ImportResult =
  | { status: "eklendi"; id: string; number: string; customer: string; issuedOn: string }
  | { status: "tekrar"; id: string; number: string; customer: string; issuedOn: string }
  | { status: "okunamadi"; reason: string };

export async function pdfText(bytes: Uint8Array) {
  // pdf.js may take over the buffer it is given; the original bytes are still needed afterwards.
  const pdf = await getDocumentProxy(bytes.slice());
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

// One PDF in: a new draft (taslak) invoice, a repeat of one already here (same ETTN), or a reason it could not be
// read. A draft counts nowhere until it is confirmed; its Müşteri is set now only if the VKN is already one.
export async function importInvoiceText(
  headers: Headers,
  input: { fileName: string; text: string; sha256: string; bytes?: Uint8Array },
): Promise<ImportResult> {
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
    const [known] = await tx.select({ id: customer.id }).from(customer).where(eq(customer.taxId, buyer.taxId));
    const [added] = await tx
      .insert(invoice)
      .values({
        ettn: parsed.ettn,
        number: parsed.number,
        issuedOn: parsed.issuedOn,
        scenario: parsed.scenario,
        type: parsed.type,
        buyer,
        customerId: known?.id ?? null,
        netAmount: parsed.netAmount.toFixed(2),
        totalAmount: parsed.totalAmount.toFixed(2),
        fileName: input.fileName,
        fileSha256: input.sha256,
        rawText: input.text,
        uploadedBy: actor.userId,
      })
      .onConflictDoNothing({ target: invoice.ettn })
      .returning({ id: invoice.id });
    const summary = { number: parsed.number, customer: buyer.name, issuedOn: parsed.issuedOn };
    const keepFile = (invoiceId: string) =>
      input.bytes ? tx.insert(invoiceFile).values({ invoiceId, bytes: Buffer.from(input.bytes) }).onConflictDoNothing() : null;
    if (!added) {
      // The same invoice uploaded again: an older upload gets its PDF now, and if it was archived, it comes back.
      const [existing] = await tx.select({ id: invoice.id }).from(invoice).where(eq(invoice.ettn, parsed.ettn));
      await keepFile(existing.id);
      const restored = await restoreInvoiceIn(tx, existing.id, { userId: actor.userId, why: "Aynı fatura tekrar yüklendi" });
      return { status: restored ? ("eklendi" as const) : ("tekrar" as const), id: existing.id, ...summary };
    }
    await keepFile(added.id);

    await logActivity(tx, {
      entity: "fatura",
      entityId: added.id,
      label: `${parsed.number} · ${buyer.name}`,
      action: "eklendi",
      detail: input.fileName,
      userId: actor.userId,
    });

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
    return { status: "eklendi" as const, id: added.id, ...summary };
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
  return importInvoiceText(headers, { fileName: input.fileName, text, sha256, bytes: input.bytes });
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
      status: invoice.status,
      customerId: invoice.customerId,
      // A draft whose VKN is not a Müşteri yet shows the buyer as printed.
      customer: sql<string>`coalesce(${customer.name}, ${invoice.buyer}->>'name')`,
      uploadedAt: invoice.uploadedAt,
      archivedAt: invoice.archivedAt,
      archiveReason: invoice.archiveReason,
    })
    .from(invoice)
    .leftJoin(customer, eq(customer.id, invoice.customerId))
    .orderBy(desc(invoice.issuedOn), desc(invoice.number));
  const lastUpload = rows.reduce<Date | null>((m, r) => (!m || r.uploadedAt > m ? r.uploadedAt : m), null);
  return { rows, lastUpload, gaps: missingNumbers(rows) };
}

// Everything the review sheet shows for one invoice: what it says, what it was matched to, and the choices.
export async function invoiceReview(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "finance.view");
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({
      id: invoice.id,
      ettn: invoice.ettn,
      number: invoice.number,
      issuedOn: invoice.issuedOn,
      scenario: invoice.scenario,
      type: invoice.type,
      status: invoice.status,
      buyer: invoice.buyer,
      customerId: invoice.customerId,
      netAmount: invoice.netAmount,
      totalAmount: invoice.totalAmount,
      fileName: invoice.fileName,
      lokasyonId: invoice.lokasyonId,
      stockDocumentId: invoice.stockDocumentId,
      confirmedAt: invoice.confirmedAt,
      confirmedBy: user.name,
      archivedAt: invoice.archivedAt,
      hasFile: sql<boolean>`exists (select 1 from ${invoiceFile} where ${invoiceFile.invoiceId} = ${invoice.id})`,
    })
    .from(invoice)
    .leftJoin(user, eq(user.id, invoice.confirmedBy))
    .where(eq(invoice.id, id));
  if (!row) return null;

  const [lines, customers, products, places, learnedRows] = await Promise.all([
    db.select().from(invoiceLine).where(eq(invoiceLine.invoiceId, id)).orderBy(asc(invoiceLine.seq)),
    db.select({ id: customer.id, name: customer.name, taxId: customer.taxId }).from(customer).orderBy(asc(customer.name)),
    db
      .select({ id: product.id, code: product.code, name: product.name, manufacturerCode: product.manufacturerCode, unit: product.unit })
      .from(product)
      .where(isNull(product.archivedAt))
      .orderBy(asc(product.name)),
    db.select({ id: lokasyon.id, name: lokasyon.name, openedAt: lokasyon.openedAt }).from(lokasyon).orderBy(asc(lokasyon.name)),
    // What earlier confirmed lines of the same name were; the latest wins.
    db
      .select({ productName: invoiceLine.productName, productId: invoiceLine.productId })
      .from(invoiceLine)
      .innerJoin(invoice, eq(invoice.id, invoiceLine.invoiceId))
      .where(and(eq(invoice.status, "onaylandi"), isNotNull(invoiceLine.productId)))
      .orderBy(asc(invoice.confirmedAt)),
  ]);
  const learned = new Map(learnedRows.map((r) => [r.productName, r.productId!]));
  const confirmed = row.status === "onaylandi";
  const isReturn = row.type === "IADE";
  const stockAction = isReturn ? "stock.receive" : "stock.out";

  return {
    ...row,
    isReturn,
    customerMatch: row.customerId ? { customerId: row.customerId, suggestions: [] } : matchCustomer(row.buyer, customers),
    customers,
    products,
    // Stock can only leave (or come back to) a Lokasyon this user may do that in and whose Açılış sayımı is done.
    lokasyon: places
      .filter((l) => l.id === row.lokasyonId || (l.openedAt && can(actor, stockAction, l.id)))
      .map((l) => ({ id: l.id, name: l.name, openedOn: l.openedAt ? istanbulDate(l.openedAt) : null })),
    lines: lines.map((l) => ({
      seq: l.seq,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      amount: l.amount,
      stockQuantity: l.stockQuantity,
      ...(confirmed ? { productId: l.productId, suggestions: [] } : matchProduct(l.description, products, learned)),
    })),
  };
}

export type InvoiceReview = NonNullable<Awaited<ReturnType<typeof invoiceReview>>>;

// "yeni": the buyer as printed becomes a new Müşteri. A line with a product and a quantity is taken from stock
// (put back, for an İade); a line with a product and no quantity is only linked; no product: not in the catalogue.
const confirmInput = z.object({
  id: z.uuid(),
  customerId: z.union([z.uuid(), z.literal("yeni")], { error: "Müşteri seçin." }),
  lokasyonId: z.uuid().nullable(),
  lines: z.array(
    z.object({
      seq: z.number().int(),
      productId: z.uuid().nullable(),
      quantity: z
        .string()
        .trim()
        .transform((v) => v.replace(",", "."))
        .nullable(),
    }),
  ),
});
export type ConfirmInvoiceInput = z.input<typeof confirmInput>;

export async function confirmInvoice(headers: Headers, input: ConfirmInvoiceInput) {
  const data = parseInput(confirmInput, input);
  const actor = await requirePermission(headers, "finance.edit");
  const [found] = await db.select({ type: invoice.type }).from(invoice).where(eq(invoice.id, data.id));
  if (!found) throw new UserError("Fatura bulunamadı.");
  const isReturn = found.type === "IADE";
  const fromStock = data.lines.filter((l) => l.productId && l.quantity);
  if (fromStock.length) {
    if (!data.lokasyonId) throw new UserError(isReturn ? "İade gelen ürünler için Lokasyon seçin." : "Stoktan düşülecek satır var; Lokasyon seçin.");
    await requirePermission(headers, isReturn ? "stock.receive" : "stock.out", data.lokasyonId);
  }

  return db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invoice).where(eq(invoice.id, data.id)).for("update");
    if (inv.archivedAt) throw new UserError("Arşivdeki fatura onaylanamaz; önce geri alın.");
    if (inv.status === "onaylandi") throw new UserError("Bu fatura zaten onaylandı.");
    const seqs = (await tx.select({ seq: invoiceLine.seq }).from(invoiceLine).where(eq(invoiceLine.invoiceId, inv.id))).map((l) => l.seq);
    const chosen = new Map(data.lines.map((l) => [l.seq, l]));
    if (chosen.size !== seqs.length || seqs.some((seq) => !chosen.has(seq))) throw new UserError("Faturanın her satırı için seçim yapın.");

    const c = await customerFor(tx, inv, data.customerId, actor.userId);
    let stockDocumentId: string | null = null;
    if (fromStock.length) {
      const reason = `${isReturn ? "İade faturası" : "Fatura"} ${inv.number} · ${c.name}`;
      const posted = await postDocumentIn(
        tx,
        { kind: "fatura", lokasyonId: data.lokasyonId, reference: inv.number, reason, userId: actor.userId, idempotencyKey: `fatura:${inv.id}` },
        fromStock.map((l) => ({
          productId: l.productId!,
          lokasyonId: data.lokasyonId,
          direction: isReturn ? ("in" as const) : ("out" as const),
          quantity: l.quantity!,
          type: isReturn ? ("satis_iadesi" as const) : ("satis_teslimati" as const),
          reason,
        })),
      );
      stockDocumentId = posted.documentId;
    }
    for (const l of data.lines) {
      await tx
        .update(invoiceLine)
        .set({ productId: l.productId, stockQuantity: l.productId && l.quantity ? l.quantity : null })
        .where(and(eq(invoiceLine.invoiceId, inv.id), eq(invoiceLine.seq, l.seq)));
    }
    await tx
      .update(invoice)
      .set({
        status: "onaylandi",
        customerId: c.id,
        lokasyonId: fromStock.length ? data.lokasyonId : null,
        stockDocumentId,
        confirmedAt: new Date(),
        confirmedBy: actor.userId,
      })
      .where(eq(invoice.id, inv.id));
    await logActivity(tx, {
      entity: "fatura",
      entityId: inv.id,
      label: `${inv.number} · ${c.name}`,
      action: "onaylandi",
      detail: fromStock.length ? `${fromStock.length} satır stok${isReturn ? "a geri girdi" : "tan düştü"}` : "Stok değişmedi",
      userId: actor.userId,
    });
    return { stockDocumentId };
  });
}

// The Müşteri a confirmed invoice belongs to. Picking the Müşteri with the invoice's own VKN, or "yeni", brings the
// invoice's name and address in as before: the newest confirmed invoice's wins, and the old name goes into the history.
async function customerFor(tx: Tx, inv: typeof invoice.$inferSelect, choice: string, userId: string) {
  const { buyer } = inv;
  if (choice !== "yeni") {
    const [picked] = await tx.select({ id: customer.id, name: customer.name, taxId: customer.taxId }).from(customer).where(eq(customer.id, choice));
    if (!picked) throw new UserError("Müşteri bulunamadı.");
    if (picked.taxId !== buyer.taxId) {
      await restoreCustomerIn(tx, picked.id, { userId: null, why: `Yeni fatura geldi: ${inv.number}` });
      return picked;
    }
  }
  const [before] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.taxId, buyer.taxId));
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
      setWhere: sql`${customer.id} not in (select customer_id from invoice where status = 'onaylandi' and issued_on > ${inv.issuedOn})`,
    })
    .returning({ id: customer.id, name: customer.name });
  const customerRow = c ?? (await tx.select({ id: customer.id, name: customer.name }).from(customer).where(eq(customer.taxId, buyer.taxId)))[0];
  if (before) {
    await recordChanges(tx, customerRow.id, { name: before.name }, { name: customerRow.name }, { source: "fatura" });
  } else {
    await linkLeadsByTaxId(tx, buyer.taxId, customerRow);
    await logActivity(tx, { entity: "musteri", entityId: customerRow.id, label: customerRow.name, action: "eklendi", detail: "İlk faturasıyla", userId });
  }
  // An invoice for an archived Müşteri brings the Müşteri back.
  await restoreCustomerIn(tx, customerRow.id, { userId: null, why: `Yeni fatura geldi: ${inv.number}` });
  return customerRow;
}

// The original PDF of an invoice, for the Finans paneli; null for invoices uploaded before originals were kept.
export async function invoicePdf(headers: Headers, id: string) {
  await requirePermission(headers, "finance.view");
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({ bytes: invoiceFile.bytes, fileName: invoice.fileName })
    .from(invoiceFile)
    .innerJoin(invoice, eq(invoice.id, invoiceFile.invoiceId))
    .where(eq(invoiceFile.invoiceId, id));
  return row ?? null;
}
