import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, type Tx } from "../db";
import { expense, expenseFile as receipt, expenseRecurrence } from "../db/schema";
import { logActivity } from "./activity";
import { isUuid, parseInput, UserError } from "./errors";
import { expenseInput, withKdv, type ExpenseInput } from "./expense-input";
import { money, tl } from "./finance-calc";
import { requirePermission } from "./guard";
import { addMonths, istanbulDate } from "./time";

export const startingCategories = ["Kira", "Maaş", "SGK", "Vergi", "Elektrik / su / doğalgaz", "Kargo", "Banka masrafı", "Muhasebe", "Tedarikçi faturası", "Diğer"];


type Repeat = { endsOn: string | null };

function expenseValues(input: ExpenseInput) {
  const data = parseInput(expenseInput, input);
  const net = Number(data.netAmount);
  const fields = {
    spentOn: data.spentOn,
    category: data.category,
    description: data.description,
    party: data.party || null,
    netAmount: money(net),
    kdvRate: data.kdvRate,
    totalAmount: money(withKdv(net, Number(data.kdvRate))),
  };
  const repeat: Repeat | null = data.repeatMonthly ? { endsOn: data.repeatUntil || null } : null;
  return { fields, repeat };
}
const activityLabel = (e: { category: string; netAmount: string }) => `${e.category} · ${tl(Number(e.netAmount))}`;
const repeatDetail = (spentOn: string, repeat: Repeat) => `${spentOn}, her ay${repeat.endsOn ? ` (${repeat.endsOn} tarihine kadar)` : ""}`;

// The expense's month counts as made, so the fill starts with the next one.
async function startRecurrence(tx: Tx, fields: ReturnType<typeof expenseValues>["fields"], repeat: Repeat, userId: string) {
  const [row] = await tx
    .insert(expenseRecurrence)
    .values({ ...fields, startsOn: fields.spentOn, endsOn: repeat.endsOn, filledThrough: fields.spentOn.slice(0, 7), createdBy: userId })
    .returning({ id: expenseRecurrence.id });
  return row.id;
}

export async function listExpenses(headers: Headers) {
  await requirePermission(headers, "finance.view");
  const { id, spentOn, category, description, party, netAmount, kdvRate, totalAmount, fileName, recurrenceId } = expense;
  return db
    .select({ id, spentOn, category, description, party, netAmount, kdvRate, totalAmount, fileName, recurrenceId, repeatEndsOn: expenseRecurrence.endsOn })
    .from(expense)
    .leftJoin(expenseRecurrence, eq(expenseRecurrence.id, expense.recurrenceId))
    .orderBy(desc(expense.spentOn), desc(expense.createdAt));
}

export async function createExpense(headers: Headers, input: ExpenseInput, today = istanbulDate(new Date())) {
  const actor = await requirePermission(headers, "finance.edit");
  const { fields, repeat } = expenseValues(input);
  const added = await db.transaction(async (tx) => {
    const recurrenceId = repeat ? await startRecurrence(tx, fields, repeat, actor.userId) : null;
    const [row] = await tx
      .insert(expense)
      .values({ ...fields, recurrenceId, createdBy: actor.userId })
      .returning({ id: expense.id });
    const detail = repeat ? repeatDetail(fields.spentOn, repeat) : fields.spentOn;
    await logActivity(tx, { entity: "gider", entityId: row.id, label: activityLabel(fields), action: "eklendi", detail, userId: actor.userId });
    return row;
  });
  if (repeat) await fillRecurringExpenses(today);
  return added;
}

// The repeat's day in that month, or the month's last day ("31" in September is the 30th).
const dayIn = (ym: string, day: number) => {
  const [y, m] = ym.split("-").map(Number);
  return `${ym}-${String(Math.min(day, new Date(Date.UTC(y, m, 0)).getUTCDate())).padStart(2, "0")}`;
};

// Makes each repeat's entries for the months whose day has come, up to its end. Safe to run any number of times.
export async function fillRecurringExpenses(today: string) {
  const open = await db
    .select()
    .from(expenseRecurrence)
    .where(and(sql`${expenseRecurrence.filledThrough} < ${today.slice(0, 7)}`, or(isNull(expenseRecurrence.endsOn), sql`${expenseRecurrence.filledThrough} < to_char(${expenseRecurrence.endsOn}, 'YYYY-MM')`)));
  for (const r of open) {
    const day = Number(r.startsOn.slice(8));
    const last = r.endsOn && r.endsOn < today ? r.endsOn : today;
    const months: string[] = [];
    for (let ym = addMonths(r.filledThrough, 1); dayIn(ym, day) <= last; ym = addMonths(ym, 1)) months.push(ym);
    if (!months.length) continue;
    await db.transaction(async (tx) => {
      // The lock and the re-read make two simultaneous fills add each month once.
      const [fresh] = await tx.select().from(expenseRecurrence).where(eq(expenseRecurrence.id, r.id)).for("update");
      const todo = months.filter((ym) => ym > fresh.filledThrough);
      if (!todo.length) return;
      await tx.insert(expense).values(
        todo.map((ym) => ({
          spentOn: dayIn(ym, day),
          category: r.category,
          description: r.description,
          party: r.party,
          netAmount: r.netAmount,
          kdvRate: r.kdvRate,
          totalAmount: r.totalAmount,
          recurrenceId: r.id,
          createdBy: r.createdBy,
        })),
      );
      await tx.update(expenseRecurrence).set({ filledThrough: todo.at(-1)! }).where(eq(expenseRecurrence.id, r.id));
    });
  }
}

// Each running repeat's next entry, soonest first.
export async function upcomingExpenses(headers: Headers) {
  await requirePermission(headers, "finance.view");
  const running = await db.select().from(expenseRecurrence);
  return running
    .map((r) => ({ id: r.id, category: r.category, description: r.description, netAmount: r.netAmount, dueOn: dayIn(addMonths(r.filledThrough, 1), Number(r.startsOn.slice(8))), endsOn: r.endsOn }))
    .filter((r) => !r.endsOn || r.dueOn <= r.endsOn)
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

// From `endsOn` on no new entry is made; entries already made stay.
export async function stopRecurrence(headers: Headers, id: string, endsOn: string) {
  const actor = await requirePermission(headers, "finance.edit");
  if (!isUuid(id)) throw new UserError("Tekrar bulunamadı.");
  const day = parseInput(z.iso.date({ error: "Bitiş tarihini seçin." }), endsOn);
  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(expenseRecurrence).where(eq(expenseRecurrence.id, id)).for("update");
    if (!current) throw new UserError("Tekrar bulunamadı.");
    if (day < current.startsOn) throw new UserError("Bitiş tarihi tekrarın başladığı günden önce olamaz.");
    await tx.update(expenseRecurrence).set({ endsOn: day }).where(eq(expenseRecurrence.id, id));
    await logActivity(tx, { entity: "gider", entityId: id, label: activityLabel(current), action: "duzenlendi", detail: `Tekrar biter: ${day}`, userId: actor.userId });
  });
}

// On an entry made by a repeat, changes touch only that month. On any other, `repeatMonthly` starts a repeat from it.
export async function updateExpense(headers: Headers, id: string, input: ExpenseInput, today = istanbulDate(new Date())) {
  const actor = await requirePermission(headers, "finance.edit");
  if (!isUuid(id)) throw new UserError("Gider bulunamadı.");
  const { fields, repeat } = expenseValues(input);
  const started = await db.transaction(async (tx) => {
    const [current] = await tx.select({ recurrenceId: expense.recurrenceId }).from(expense).where(eq(expense.id, id)).for("update");
    if (!current) throw new UserError("Gider bulunamadı.");
    const start = repeat && !current.recurrenceId ? repeat : null;
    const recurrenceId = start ? await startRecurrence(tx, fields, start, actor.userId) : current.recurrenceId;
    await tx
      .update(expense)
      .set({ ...fields, recurrenceId, updatedAt: new Date() })
      .where(eq(expense.id, id));
    const detail = start ? repeatDetail(fields.spentOn, start) : fields.spentOn;
    await logActivity(tx, { entity: "gider", entityId: id, label: activityLabel(fields), action: "duzenlendi", detail, userId: actor.userId });
    return Boolean(start);
  });
  if (started) await fillRecurringExpenses(today);
}

export async function deleteExpense(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "finance.edit");
  if (!isUuid(id)) throw new UserError("Gider bulunamadı.");
  await db.transaction(async (tx) => {
    const [row] = await tx.delete(expense).where(eq(expense.id, id)).returning();
    if (!row) throw new UserError("Gider bulunamadı.");
    await logActivity(tx, { entity: "gider", entityId: id, label: activityLabel(row), action: "silindi", detail: row.spentOn, userId: actor.userId });
  });
}

const receiptTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];

// One receipt per expense; a new one replaces the old.
export async function attachExpenseFile(headers: Headers, id: string, file: { fileName: string; contentType: string; bytes: Uint8Array }) {
  const actor = await requirePermission(headers, "finance.edit");
  if (!isUuid(id)) throw new UserError("Gider bulunamadı.");
  if (!receiptTypes.includes(file.contentType)) throw new UserError("Fiş PDF ya da fotoğraf olmalı.");
  if (file.bytes.length > 4 * 1024 * 1024) throw new UserError("Dosya 4 MB'tan büyük.");
  await db.transaction(async (tx) => {
    const [row] = await tx.update(expense).set({ fileName: file.fileName }).where(eq(expense.id, id)).returning();
    if (!row) throw new UserError("Gider bulunamadı.");
    await logActivity(tx, { entity: "gider", entityId: id, label: activityLabel(row), action: "duzenlendi", detail: `Fiş eklendi: ${file.fileName}`, userId: actor.userId });
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
