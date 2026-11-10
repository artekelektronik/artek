import { createHash } from "node:crypto";
import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { extractText, getDocumentProxy } from "unpdf";
import { db, type Tx } from "../db";
import { customer, invoice, invoiceFile, invoiceLine, lokasyon, payment, product, productComponent, stockMovement, user, type InvoiceBuyer, type LineComponent } from "../db/schema";
import { logActivity } from "./activity";
import { restoreCustomerIn, restoreInvoiceIn } from "./archive";
import { recordChanges } from "./customer-changes";
import { isUuid, parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";
import { matchCustomer, matchProduct, newCustomer, prepareProducts } from "./invoice-match";
import { postDocumentIn, reversalLine } from "./ledger";
import { can } from "./permissions";
import { formatIstanbulTime, istanbulDate } from "./time";
import { linkLeadsByTaxId } from "./leads";
import { manualTotals, missingNumbers, money } from "./finance-calc";
import { InvoiceParseError, parseInvoiceText, productGroup, productName } from "./invoice-parse";

export type ImportResult =
  | { status: "eklendi" | "tekrar"; id: string; number: string; customer: string; issuedOn: string; pdfAdded?: boolean }
  | { status: "okunamadi"; reason: string };

const hasFile = sql<boolean>`exists (select 1 from ${invoiceFile} where ${invoiceFile.invoiceId} = ${invoice.id})`;
const isManual = sql<boolean>`${invoice.ettn} is null`; // typed by hand, its PDF not uploaded yet

export async function pdfText(bytes: Uint8Array) {
  // pdf.js may take over the buffer it is given; the original bytes are still needed afterwards.
  const pdf = await getDocumentProxy(bytes.slice());
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

// A new draft, a repeat (same ETTN) or a reason it can't be read; the Müşteri is set only if the VKN is known.
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
    const fields = {
      ettn: parsed.ettn,
      number: parsed.number,
      issuedOn: parsed.issuedOn,
      scenario: parsed.scenario,
      type: parsed.type,
      buyer,
      netAmount: parsed.netAmount.toFixed(2),
      totalAmount: parsed.totalAmount.toFixed(2),
      fileName: input.fileName,
      fileSha256: input.sha256,
      rawText: input.text,
      uploadedBy: actor.userId,
    };
    const summary = { number: parsed.number, customer: buyer.name, issuedOn: parsed.issuedOn };
    // True when the PDF was stored now (an invoice uploaded before PDFs were kept gets it on a repeat).
    const keepFile = async (invoiceId: string) =>
      Boolean(
        input.bytes &&
          (await tx.insert(invoiceFile).values({ invoiceId, bytes: Buffer.from(input.bytes) }).onConflictDoNothing().returning({ id: invoiceFile.invoiceId })).length,
      );
    type Picked = Pick<typeof invoiceLine.$inferSelect, "productId" | "stockQuantity" | "components">;
    const insertLines = (invoiceId: string, picked = new Map<number, Picked>()) =>
      parsed.lines.length
        ? tx.insert(invoiceLine).values(
            parsed.lines.map((line, i) => ({
              invoiceId,
              seq: i + 1,
              description: line.description,
              productName: productName(line.description),
              productGroup: productGroup(line.description),
              quantity: String(line.quantity),
              unit: line.unit,
              unitPrice: String(line.unitPrice),
              amount: line.amount.toFixed(2),
              ...picked.get(i + 1),
            })),
          )
        : null;

    // A manual draft with this number takes the PDF's data and keeps the choices made for its lines.
    const [manual] = await tx
      .select({ id: invoice.id, customerId: invoice.customerId })
      .from(invoice)
      .where(and(isNull(invoice.ettn), eq(invoice.number, parsed.number), eq(invoice.status, "taslak")));
    if (manual) {
      const lines = await tx
        .select({ seq: invoiceLine.seq, productId: invoiceLine.productId, stockQuantity: invoiceLine.stockQuantity, components: invoiceLine.components })
        .from(invoiceLine)
        .where(eq(invoiceLine.invoiceId, manual.id));
      await tx.update(invoice).set({ ...fields, customerId: known?.id ?? manual.customerId }).where(eq(invoice.id, manual.id));
      await tx.delete(invoiceLine).where(eq(invoiceLine.invoiceId, manual.id));
      await insertLines(manual.id, new Map(lines.map(({ seq, ...picked }) => [seq, picked])));
      await keepFile(manual.id);
      await logActivity(tx, { entity: "fatura", entityId: manual.id, label: `${parsed.number} · ${buyer.name}`, action: "duzenlendi", detail: `PDF eklendi: ${input.fileName}`, userId: actor.userId });
      return { status: "eklendi" as const, id: manual.id, ...summary };
    }

    const [added] = await tx
      .insert(invoice)
      .values({ ...fields, customerId: known?.id ?? null })
      .onConflictDoNothing({ target: invoice.ettn })
      .returning({ id: invoice.id });
    if (!added) {
      // A repeat attaches a missing PDF and brings an archived invoice back.
      const [existing] = await tx.select({ id: invoice.id }).from(invoice).where(eq(invoice.ettn, parsed.ettn));
      const pdfAdded = await keepFile(existing.id);
      const restored = await restoreInvoiceIn(tx, existing.id, { userId: actor.userId, why: "Aynı fatura tekrar yüklendi" });
      return { status: restored ? ("eklendi" as const) : ("tekrar" as const), id: existing.id, ...summary, pdfAdded };
    }
    await keepFile(added.id);
    await logActivity(tx, { entity: "fatura", entityId: added.id, label: `${parsed.number} · ${buyer.name}`, action: "eklendi", detail: input.fileName, userId: actor.userId });
    await insertLines(added.id);
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
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      manual: isManual,
      customerId: invoice.customerId,
      // A draft whose VKN is not a Müşteri yet shows the buyer as printed.
      customer: sql<string>`coalesce(${customer.name}, ${invoice.buyer}->>'name')`,
      uploadedAt: invoice.uploadedAt,
      archivedAt: invoice.archivedAt,
      archiveReason: invoice.archiveReason,
      hasFile,
    })
    .from(invoice)
    .leftJoin(customer, eq(customer.id, invoice.customerId))
    .orderBy(desc(invoice.issuedOn), desc(invoice.number));
  const lastUpload = rows.reduce<Date | null>((m, r) => (!m || r.uploadedAt > m ? r.uploadedAt : m), null);
  return { rows, lastUpload, gaps: missingNumbers(rows) };
}

// The newest invoices for the Finans özet, drafts included so they get confirmed.
export async function recentInvoices(headers: Headers, limit: number) {
  await requirePermission(headers, "finance.view");
  return db
    .select({
      id: invoice.id,
      number: invoice.number,
      type: invoice.type,
      issuedOn: invoice.issuedOn,
      netAmount: invoice.netAmount,
      status: invoice.status,
      customer: sql<string>`coalesce(${customer.name}, ${invoice.buyer}->>'name')`,
    })
    .from(invoice)
    .leftJoin(customer, eq(customer.id, invoice.customerId))
    .where(isNull(invoice.archivedAt))
    .orderBy(desc(invoice.issuedOn), desc(invoice.number))
    .limit(limit);
}

// What the invoice forms pick from; recipes are each Ürün's reçete (what one unit uses).
async function pickerOptions() {
  const [customers, products, recipeRows] = await Promise.all([
    db.select({ id: customer.id, name: customer.name, taxId: customer.taxId }).from(customer).orderBy(asc(customer.name)),
    db
      .select({ id: product.id, code: product.code, name: product.name, category: product.category, manufacturerCode: product.manufacturerCode, unit: product.unit })
      .from(product)
      .where(isNull(product.archivedAt))
      .orderBy(asc(product.name)),
    db.select().from(productComponent),
  ]);
  const recipes: Record<string, LineComponent[]> = {};
  for (const r of recipeRows) (recipes[r.productId] ??= []).push({ productId: r.componentId, quantity: r.quantity });
  return { customers, products, recipes };
}

export async function manualInvoiceOptions(headers: Headers) {
  await requirePermission(headers, "finance.edit");
  return pickerOptions();
}

// The review sheet's data: the invoice, its suggested matches and the choices.
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
      manual: isManual,
      buyer: invoice.buyer,
      customerId: invoice.customerId,
      netAmount: invoice.netAmount,
      totalAmount: invoice.totalAmount,
      fileName: invoice.fileName,
      lokasyonId: invoice.lokasyonId,
      materialsLokasyonId: invoice.materialsLokasyonId,
      stockDocumentId: invoice.stockDocumentId,
      confirmedAt: invoice.confirmedAt,
      confirmedBy: user.name,
      archivedAt: invoice.archivedAt,
      hasFile,
    })
    .from(invoice)
    .leftJoin(user, eq(user.id, invoice.confirmedBy))
    .where(eq(invoice.id, id));
  if (!row) return null;
  const confirmed = row.status === "onaylandi";

  const proforma = row.scenario === proformaScenario;
  const [lines, { customers, products, recipes }, places, learnedRows, payments, openProformas] = await Promise.all([
    db.select().from(invoiceLine).where(eq(invoiceLine.invoiceId, id)).orderBy(asc(invoiceLine.seq)),
    pickerOptions(),
    db.select({ id: lokasyon.id, name: lokasyon.name, openedAt: lokasyon.openedAt }).from(lokasyon).orderBy(asc(lokasyon.name)),
    // Earlier confirmed lines with this invoice's line names; the latest wins.
    confirmed
      ? []
      : db
          .select({ productName: invoiceLine.productName, productId: invoiceLine.productId })
          .from(invoiceLine)
          .innerJoin(invoice, eq(invoice.id, invoiceLine.invoiceId))
          .where(
            and(
              eq(invoice.status, "onaylandi"),
              isNotNull(invoiceLine.productId),
              sql`${invoiceLine.productName} in (select product_name from invoice_line where invoice_id = ${id})`,
            ),
          )
          .orderBy(asc(invoice.confirmedAt)),
    db.select().from(payment).where(eq(payment.invoiceId, id)).orderBy(asc(payment.paidOn), asc(payment.createdAt)),
    // An uploaded e-Fatura still waiting can become one of these (ADR-0008); the buyer's own first.
    row.ettn && !confirmed
      ? db
          .select({ id: invoice.id, number: invoice.number, issuedOn: invoice.issuedOn, netAmount: invoice.netAmount, buyer: invoice.buyer })
          .from(invoice)
          .where(and(eq(invoice.scenario, proformaScenario), isNull(invoice.archivedAt)))
          .orderBy(desc(invoice.issuedOn))
      : [],
  ]);
  const learned = new Map(learnedRows.map((r) => [r.productName, r.productId!]));
  const prepared = prepareProducts(products);
  const isReturn = row.type === "IADE";
  const stockAction = isReturn ? "stock.receive" : "stock.out";

  return {
    ...row,
    proforma,
    payments,
    openProformas: openProformas
      .map(({ buyer, ...p }) => ({ ...p, buyerName: buyer.name, sameBuyer: buyer.taxId === row.buyer.taxId }))
      .sort((a, b) => Number(b.sameBuyer) - Number(a.sameBuyer)),
    confirmedAtText: row.confirmedAt ? formatIstanbulTime(row.confirmedAt) : null,
    isReturn,
    customerMatch: row.customerId ? { customerId: row.customerId, suggestions: [] } : matchCustomer(row.buyer, customers),
    customers,
    products,
    // Only opened Lokasyon where this user may move stock.
    lokasyon: places
      .filter((l) => l.id === row.lokasyonId || (l.openedAt && can(actor, stockAction, l.id)))
      .map((l) => ({ id: l.id, name: l.name, openedOn: l.openedAt ? istanbulDate(l.openedAt) : null })),
    lines: lines.map((l) => ({
      seq: l.seq,
      description: l.description,
      builtToOrder: l.productGroup === "Özel trafo",
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      amount: l.amount,
      stockQuantity: l.stockQuantity,
      components: l.components,
      ...(confirmed || l.productId ? { productId: l.productId, suggestions: [] } : matchProduct(l.description, prepared, learned)),
    })),
    recipes,
  };
}

export type InvoiceReview = NonNullable<Awaited<ReturnType<typeof invoiceReview>>>;

const amountText = z
  .string()
  .trim()
  .transform((v) => v.replace(",", "."))
  .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, { error: "Miktar ve fiyat sıfırdan büyük olmalı." });

const componentsInput = z.array(z.object({ productId: z.uuid(), quantity: amountText })).default([]);

// A line with stockQuantity moves its product; with components it is built from them (üretim tüketimi); else it only links.
const confirmInput = z.object({
  id: z.uuid(),
  customerId: z.union([z.uuid(), z.literal(newCustomer)], { error: "Müşteri seçin." }),
  lokasyonId: z.uuid().nullable(),
  materialsLokasyonId: z.uuid().nullable().default(null),
  lines: z.array(
    z.object({
      seq: z.number().int(),
      productId: z.uuid().nullable(),
      quantity: amountText.optional(), // edited on the sheet; omitted keeps the printed line
      unitPrice: amountText.optional(),
      stockQuantity: amountText.nullable(),
      components: componentsInput,
    }),
  ),
});
export type ConfirmInvoiceInput = z.input<typeof confirmInput>;

export async function confirmInvoice(headers: Headers, input: ConfirmInvoiceInput) {
  const data = parseInput(confirmInput, input);
  const actor = await requirePermission(headers, "finance.edit");
  const fromStock = data.lines.filter((l) => l.productId && l.stockQuantity);
  const built = data.lines.filter((l) => l.components.length);

  return db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invoice).where(eq(invoice.id, data.id)).for("update");
    if (!inv) throw new UserError("Fatura bulunamadı.");
    if (!inv.ettn && inv.scenario !== proformaScenario) throw new UserError("Elle girilen fatura, PDF'i yüklenmeden onaylanamaz.");
    if (inv.archivedAt) throw new UserError("Arşivdeki fatura onaylanamaz; önce geri alın.");
    if (inv.status === "onaylandi") throw new UserError("Bu fatura zaten onaylandı.");
    const isReturn = inv.type === "IADE";
    if (fromStock.length) {
      if (!data.lokasyonId) throw new UserError(isReturn ? "İade gelen ürünler için Lokasyon seçin." : "Stoktan düşülecek satır var; Lokasyon seçin.");
      await requirePermission(headers, isReturn ? "stock.receive" : "stock.out", data.lokasyonId);
    }
    if (built.length) {
      if (isReturn) throw new UserError("İade faturasında malzemeden üretim seçilemez.");
      if (!data.materialsLokasyonId) throw new UserError("Malzemelerin çıktığı Lokasyonu seçin.");
      await requirePermission(headers, "stock.out", data.materialsLokasyonId);
    }
    const stored = new Map((await tx.select().from(invoiceLine).where(eq(invoiceLine.invoiceId, inv.id))).map((l) => [l.seq, l]));
    if (data.lines.length !== stored.size || data.lines.some((l) => !stored.has(l.seq))) throw new UserError("Faturanın her satırı için seçim yapın.");

    const c = await customerFor(tx, inv, data.customerId, actor.userId);
    let stockDocumentId: string | null = null;
    if (fromStock.length || built.length) {
      const reason = `${isReturn ? "İade faturası" : "Fatura"} ${inv.number} · ${c.name}`;
      const posted = await postDocumentIn(
        tx,
        { kind: "fatura", lokasyonId: data.lokasyonId ?? data.materialsLokasyonId, reference: inv.number, reason, userId: actor.userId, idempotencyKey: `fatura:${inv.id}` },
        [
          ...fromStock.map((l) => ({
            productId: l.productId!,
            lokasyonId: data.lokasyonId,
            direction: isReturn ? ("in" as const) : ("out" as const),
            quantity: l.stockQuantity!,
            type: isReturn ? ("satis_iadesi" as const) : ("satis_teslimati" as const),
            reason,
          })),
          ...built.flatMap((l) =>
            l.components.map((m) => ({ productId: m.productId, lokasyonId: data.materialsLokasyonId, direction: "out" as const, quantity: m.quantity, type: "uretim_tuketimi" as const, reason })),
          ),
        ],
      );
      stockDocumentId = posted.documentId;
    }

    // An edited quantity or price recomputes the line; the KDV-included total keeps its ratio to the net.
    const lines = data.lines.map((l) => {
      const was = stored.get(l.seq)!;
      const quantity = l.quantity ?? was.quantity;
      const unitPrice = l.unitPrice ?? was.unitPrice;
      const edited = Number(quantity) !== Number(was.quantity) || Number(unitPrice) !== Number(was.unitPrice);
      return { ...l, quantity, unitPrice, edited, amount: edited ? money(Number(quantity) * Number(unitPrice)) : was.amount };
    });
    for (const l of lines) {
      await tx
        .update(invoiceLine)
        .set({
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.amount,
          productId: l.productId,
          stockQuantity: l.productId ? l.stockQuantity : null,
          components: l.components.length ? l.components : null,
        })
        .where(and(eq(invoiceLine.invoiceId, inv.id), eq(invoiceLine.seq, l.seq)));
    }

    // Each built product remembers its materials per unit for the next invoice.
    const recipes = lines.filter((l) => l.productId && l.components.length);
    if (recipes.length) {
      await tx.delete(productComponent).where(inArray(productComponent.productId, recipes.map((l) => l.productId!)));
      await tx.insert(productComponent).values(
        recipes.flatMap((l) =>
          l.components.map((m) => ({ productId: l.productId!, componentId: m.productId, quantity: (Number(m.quantity) / Number(l.quantity)).toFixed(3) })),
        ),
      );
    }
    const net = lines.reduce((sum, l) => sum + Number(l.amount), 0);

    await tx
      .update(invoice)
      .set({
        status: "onaylandi",
        customerId: c.id,
        lokasyonId: fromStock.length ? data.lokasyonId : null,
        materialsLokasyonId: built.length ? data.materialsLokasyonId : null,
        stockDocumentId,
        confirmedAt: new Date(),
        confirmedBy: actor.userId,
        ...(lines.some((l) => l.edited) && {
          netAmount: money(net),
          totalAmount: money(Number(inv.netAmount) ? (Number(inv.totalAmount) * net) / Number(inv.netAmount) : net),
        }),
      })
      .where(eq(invoice.id, inv.id));
    const moved = [fromStock.length && `${fromStock.length} satır stok${isReturn ? "a geri girdi" : "tan düştü"}`, built.length && `${built.length} satır malzemeden üretildi`];
    await logActivity(tx, {
      entity: "fatura",
      entityId: inv.id,
      label: `${inv.number} · ${c.name}`,
      action: "onaylandi",
      detail: moved.filter(Boolean).join(", ") || "Stok değişmedi",
      userId: actor.userId,
    });
    return { stockDocumentId };
  });
}

// Gone for good: its lines and PDF with it; stock it moved goes back as a ters kayıt.
export async function deleteInvoice(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "finance.edit");
  if (!isUuid(id)) throw new UserError("Fatura bulunamadı.");
  await db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invoice).where(eq(invoice.id, id)).for("update");
    if (!inv) throw new UserError("Fatura bulunamadı.");
    const reason = `Fatura ${inv.number} silindi`;
    if (inv.stockDocumentId) {
      const moves = await tx.select().from(stockMovement).where(eq(stockMovement.documentId, inv.stockDocumentId));
      // Movements someone already reversed by hand stay as they are.
      const reversed = moves.length
        ? new Set((await tx.select({ id: stockMovement.reversesId }).from(stockMovement).where(inArray(stockMovement.reversesId, moves.map((m) => m.id)))).map((r) => r.id))
        : new Set();
      const open = moves.filter((m) => !reversed.has(m.id));
      if (open.length) {
        await postDocumentIn(
          tx,
          { kind: "ters_kayit", lokasyonId: inv.lokasyonId ?? inv.materialsLokasyonId, reference: inv.number, reason, userId: actor.userId, idempotencyKey: `fatura-sil:${id}` },
          open.map((m) => reversalLine(m, reason)),
        );
      }
    }
    await tx.delete(invoiceLine).where(eq(invoiceLine.invoiceId, id));
    await tx.delete(invoiceFile).where(eq(invoiceFile.invoiceId, id));
    await tx.delete(invoice).where(eq(invoice.id, id));
    await logActivity(tx, {
      entity: "fatura",
      entityId: id,
      label: `${inv.number} · ${inv.buyer.name}`,
      action: "silindi",
      detail: inv.stockDocumentId ? "Stok hareketleri ters kaydedildi" : null,
      userId: actor.userId,
    });
  });
}

export const proformaScenario = "PROFORMA";

const manualInput = z.object({
  proforma: z.boolean().default(false), // numbered PRF-…, confirmed without a PDF (ADR-0008)
  number: z.string().trim(),
  issuedOn: z.iso.date({ error: "Tarihi seçin." }),
  type: z.enum(["SATIS", "IADE"]),
  scenario: z.enum(["TEMELFATURA", "EARSIVFATURA"]),
  kdvRate: z.coerce.number().min(0).max(100),
  pricesIncludeKdv: z.boolean().default(false), // typed prices are KDV dahil; stored without KDV like every line
  customerId: z.uuid().nullable(),
  buyer: z.object({ name: z.string().trim(), taxId: z.string().trim() }),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1, { error: "Açıklama yazın." }),
        quantity: amountText,
        unit: z.string().trim().min(1),
        unitPrice: amountText,
        productId: z.uuid().nullable(),
        stockQuantity: amountText.nullable().default(null),
        components: componentsInput,
      }),
    )
    .min(1, { error: "En az bir satır girin." }),
});
export type ManualInvoiceInput = z.input<typeof manualInput>;

export async function createManualInvoice(headers: Headers, input: ManualInvoiceInput) {
  const actor = await requirePermission(headers, "finance.edit");
  const data = parseInput(manualInput, input);
  if (!data.proforma && data.number.length < 3) throw new UserError("Fatura numarasını yazın.");
  let buyer: InvoiceBuyer;
  if (data.customerId) {
    const [c] = await db.select().from(customer).where(eq(customer.id, data.customerId));
    if (!c) throw new UserError("Müşteri bulunamadı.");
    buyer = { name: c.name, taxId: c.taxId, taxIdType: c.taxIdType === "TCKN" ? "TCKN" : "VKN", city: c.city, district: c.district, email: c.email };
  } else {
    if (!data.buyer.name || !/^\d{10,11}$/.test(data.buyer.taxId)) throw new UserError("Yeni müşteri için ad ve 10 haneli VKN ya da 11 haneli TCKN yazın.");
    buyer = { name: data.buyer.name, taxId: data.buyer.taxId, taxIdType: data.buyer.taxId.length === 11 ? "TCKN" : "VKN", city: "", district: "", email: null };
  }
  const { amounts: lineNets, net, total } = manualTotals(
    data.lines.map((l) => ({ quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })),
    data.kdvRate,
    data.pricesIncludeKdv,
  );
  const amounts = lineNets.map(money);
  const unitPrices = data.lines.map((l) => (Number(l.unitPrice) / (data.pricesIncludeKdv ? 1 + data.kdvRate / 100 : 1)).toFixed(4));

  return db.transaction(async (tx) => {
    const number = data.proforma ? await nextProformaNumber(tx, data.issuedOn.slice(0, 4)) : data.number;
    const [taken] = await tx.select({ id: invoice.id }).from(invoice).where(eq(invoice.number, number));
    if (taken) throw new UserError(`${number} numaralı fatura zaten var.`);
    const [added] = await tx
      .insert(invoice)
      .values({
        number,
        issuedOn: data.issuedOn,
        scenario: data.proforma ? proformaScenario : data.scenario,
        type: data.type,
        buyer,
        customerId: data.customerId,
        netAmount: money(net),
        totalAmount: money(total),
        uploadedBy: actor.userId,
      })
      .returning({ id: invoice.id });
    await tx.insert(invoiceLine).values(
      data.lines.map((l, i) => ({
        invoiceId: added.id,
        seq: i + 1,
        description: l.description,
        productName: productName(l.description),
        productGroup: productGroup(l.description),
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: unitPrices[i],
        amount: amounts[i],
        productId: l.productId,
        stockQuantity: l.productId ? l.stockQuantity : null,
        components: l.productId && l.components.length ? l.components : null,
      })),
    );
    await logActivity(tx, { entity: "fatura", entityId: added.id, label: `${number} · ${buyer.name}`, action: "eklendi", detail: data.proforma ? "Proforma" : "Elle girildi", userId: actor.userId });
    return added.id;
  });
}

// PRF-2026-0001, PRF-2026-0002 … per year; a lock per year keeps two at once from taking the same number.
async function nextProformaNumber(tx: Tx, year: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`proforma:${year}`}))`);
  const [last] = await tx
    .select({ number: invoice.number })
    .from(invoice)
    .where(sql`${invoice.number} like ${`PRF-${year}-%`}`)
    .orderBy(desc(invoice.number))
    .limit(1);
  const n = last ? Number(last.number.slice(-4)) + 1 : 1;
  return `PRF-${year}-${String(n).padStart(4, "0")}`;
}

// The uploaded e-Fatura becomes its proforma: the proforma takes the PDF's identity, file and totals,
// keeps its lines, stock and payments, and the upload goes away (ADR-0008).
export async function attachToProforma(headers: Headers, uploadedId: string, proformaId: string) {
  const actor = await requirePermission(headers, "finance.edit");
  if (!isUuid(uploadedId) || !isUuid(proformaId)) throw new UserError("Fatura bulunamadı.");
  await db.transaction(async (tx) => {
    const [up] = await tx.select().from(invoice).where(eq(invoice.id, uploadedId)).for("update");
    const [pro] = await tx.select().from(invoice).where(eq(invoice.id, proformaId)).for("update");
    if (!up?.ettn || up.status !== "taslak" || up.archivedAt) throw new UserError("Yalnız onay bekleyen yüklenmiş bir e-Fatura bağlanabilir.");
    if (pro?.scenario !== proformaScenario) throw new UserError("Proforma bulunamadı.");
    if (Math.abs(Number(up.netAmount) - Number(pro.netAmount)) > 1) {
      throw new UserError(`Tutarlar tutmuyor: e-Fatura ${up.netAmount} TL, proforma ${pro.netAmount} TL (KDV hariç). Önce proformayı düzeltin.`);
    }
    const [file] = await tx.select().from(invoiceFile).where(eq(invoiceFile.invoiceId, up.id));
    await tx.update(payment).set({ invoiceId: pro.id }).where(eq(payment.invoiceId, up.id));
    await tx.delete(invoiceFile).where(eq(invoiceFile.invoiceId, up.id));
    await tx.delete(invoiceLine).where(eq(invoiceLine.invoiceId, up.id));
    await tx.delete(invoice).where(eq(invoice.id, up.id));
    const { ettn, number, issuedOn, scenario, type, buyer, netAmount, totalAmount, fileName, fileSha256, rawText } = up;
    await tx
      .update(invoice)
      .set({ ettn, number, issuedOn, scenario, type, buyer, netAmount, totalAmount, fileName, fileSha256, rawText, customerId: pro.customerId ?? up.customerId })
      .where(eq(invoice.id, pro.id));
    if (file) await tx.insert(invoiceFile).values({ invoiceId: pro.id, bytes: file.bytes });
    await logActivity(tx, { entity: "fatura", entityId: pro.id, label: `${number} · ${buyer.name}`, action: "duzenlendi", detail: `${pro.number} proformasına bağlandı`, userId: actor.userId });
  });
}

// Another firm is just linked; its own VKN or "yeni" upserts the buyer, the newest confirmed invoice's name winning.
async function customerFor(tx: Tx, inv: typeof invoice.$inferSelect, choice: string, userId: string) {
  const { buyer } = inv;
  if (choice !== newCustomer) {
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
  await restoreCustomerIn(tx, customerRow.id, { userId: null, why: `Yeni fatura geldi: ${inv.number}` });
  return customerRow;
}

// Null for invoices uploaded before PDFs were kept.
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
