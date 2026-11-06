import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { expense, expenseFile as receipt } from "../db/schema";
import { logActivity } from "./activity";
import { isUuid, parseInput, UserError } from "./errors";
import { money, tl } from "./finance-calc";
import { requirePermission } from "./guard";

export const startingCategories = ["Kira", "Maaş", "SGK", "Vergi", "Elektrik / su / doğalgaz", "Kargo", "Banka masrafı", "Muhasebe", "Tedarikçi faturası", "Diğer"];

const decimalText = (error: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v)) // "20.000,50" → "20000.50"
    .refine((v) => /^\d+(\.\d+)?$/.test(v), { error });

const expenseInput = z.object({
  spentOn: z.iso.date({ error: "Tarihi seçin." }),
  category: z.string().trim().min(1, { error: "Kategori seçin." }),
  description: z.string().trim().max(500).default(""),
  party: z.string().trim().max(200).default(""),
  netAmount: decimalText("Tutar sayı olmalı.").refine((v) => Number(v) > 0, { error: "Tutar sıfırdan büyük olmalı." }),
  kdvRate: decimalText("KDV oranı sayı olmalı.").refine((v) => Number(v) <= 100, { error: "KDV oranı 0–100 arası olmalı." }),
});
export type ExpenseInput = z.input<typeof expenseInput>;

function values(input: ExpenseInput) {
  const data = parseInput(expenseInput, input);
  const net = Number(data.netAmount);
  return {
    spentOn: data.spentOn,
    category: data.category,
    description: data.description,
    party: data.party || null,
    netAmount: money(net),
    totalAmount: money(net * (1 + Number(data.kdvRate) / 100)),
  };
}
const label = (e: { category: string; netAmount: string }) => `${e.category} · ${tl(Number(e.netAmount))}`;

export async function listExpenses(headers: Headers) {
  await requirePermission(headers, "finance.view");
  return db.select().from(expense).orderBy(desc(expense.spentOn), desc(expense.createdAt));
}

export async function createExpense(headers: Headers, input: ExpenseInput) {
  const actor = await requirePermission(headers, "finance.edit");
  const fields = values(input);
  return db.transaction(async (tx) => {
    const [added] = await tx
      .insert(expense)
      .values({ ...fields, createdBy: actor.userId })
      .returning({ id: expense.id });
    await logActivity(tx, { entity: "gider", entityId: added.id, label: label(fields), action: "eklendi", detail: fields.spentOn, userId: actor.userId });
    return added;
  });
}

export async function updateExpense(headers: Headers, id: string, input: ExpenseInput) {
  const actor = await requirePermission(headers, "finance.edit");
  if (!isUuid(id)) throw new UserError("Gider bulunamadı.");
  const fields = values(input);
  await db.transaction(async (tx) => {
    const [row] = await tx
      .update(expense)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(expense.id, id))
      .returning({ id: expense.id });
    if (!row) throw new UserError("Gider bulunamadı.");
    await logActivity(tx, { entity: "gider", entityId: id, label: label(fields), action: "duzenlendi", detail: fields.spentOn, userId: actor.userId });
  });
}

export async function deleteExpense(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "finance.edit");
  if (!isUuid(id)) throw new UserError("Gider bulunamadı.");
  await db.transaction(async (tx) => {
    const [row] = await tx.delete(expense).where(eq(expense.id, id)).returning();
    if (!row) throw new UserError("Gider bulunamadı.");
    await logActivity(tx, { entity: "gider", entityId: id, label: label(row), action: "silindi", detail: row.spentOn, userId: actor.userId });
  });
}

const receiptTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];

// One receipt per expense; a new one replaces the old.
export async function attachExpenseFile(headers: Headers, id: string, file: { fileName: string; contentType: string; bytes: Uint8Array }) {
  await requirePermission(headers, "finance.edit");
  if (!isUuid(id)) throw new UserError("Gider bulunamadı.");
  if (!receiptTypes.includes(file.contentType)) throw new UserError("Fiş PDF ya da fotoğraf olmalı.");
  if (file.bytes.length > 4 * 1024 * 1024) throw new UserError("Dosya 4 MB'tan büyük.");
  await db.transaction(async (tx) => {
    const [row] = await tx.update(expense).set({ fileName: file.fileName }).where(eq(expense.id, id)).returning({ id: expense.id });
    if (!row) throw new UserError("Gider bulunamadı.");
    await tx
      .insert(receipt)
      .values({ expenseId: id, contentType: file.contentType, bytes: Buffer.from(file.bytes) })
      .onConflictDoUpdate({ target: receipt.expenseId, set: { contentType: file.contentType, bytes: Buffer.from(file.bytes) } });
  });
}

export async function expenseFile(headers: Headers, id: string) {
  await requirePermission(headers, "finance.view");
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({ bytes: receipt.bytes, contentType: receipt.contentType, fileName: expense.fileName })
    .from(receipt)
    .innerJoin(expense, eq(expense.id, receipt.expenseId))
    .where(eq(receipt.expenseId, id));
  return row ?? null;
}
