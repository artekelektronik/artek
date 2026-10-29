import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { activityLog, user } from "../db/schema";
import { requirePermission } from "./guard";
import { can } from "./permissions";

// The İşlem geçmişi: one row per add, edit, archive or restore of a Fatura, Müşteri or Aday, with who and when.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Activity = Omit<typeof activityLog.$inferInsert, "id" | "createdAt">;

export async function logActivity(tx: Tx | typeof db, row: Activity | Activity[]) {
  const rows = Array.isArray(row) ? row : [row];
  if (rows.length) await tx.insert(activityLog).values(rows);
}

// Newest first; invoice rows only for people who may see Faturalar.
export async function listActivity(headers: Headers, limit = 500) {
  const actor = await requirePermission(headers, "crm.view");
  const rows = await db
    .select({ log: activityLog, author: user.name })
    .from(activityLog)
    .leftJoin(user, eq(user.id, activityLog.userId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
  const invoices = can(actor, "finance.view");
  return rows.filter((r) => invoices || r.log.entity !== "fatura").map(({ log, author }) => ({ ...log, author }));
}
