import { and, ne } from "drizzle-orm";
import { db } from "../db";
import { expense, invoice } from "../db/schema";
import { countedInvoice } from "./finance";
import { requirePermission } from "./guard";
import { monthlyKdv } from "./kdv-calc";
import { proformaScenario } from "./labels";

// Every month's KDV: confirmed e-Faturalar (a proforma has no KDV to declare yet) less Giderler.
export async function kdvByMonth(headers: Headers) {
  await requirePermission(headers, "finance.view");
  const [sales, spent] = await Promise.all([
    db
      .select({ day: invoice.issuedOn, netAmount: invoice.netAmount, totalAmount: invoice.totalAmount, type: invoice.type })
      .from(invoice)
      .where(and(countedInvoice, ne(invoice.scenario, proformaScenario))),
    db.select({ day: expense.spentOn, netAmount: expense.netAmount, totalAmount: expense.totalAmount }).from(expense),
  ]);
  return monthlyKdv(
    sales.map((s) => ({ ...s, isReturn: s.type === "IADE" })),
    spent,
  );
}
