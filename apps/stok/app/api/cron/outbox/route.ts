import { queueActivityReports } from "@/lib/activity-report";
import { cronAuthorized } from "@/lib/cron-auth";
import { fillRecurringExpenses } from "@/lib/expenses";
import { queueFinanceReminders } from "@/lib/finance-reminders";
import { processOutbox } from "@/lib/outbox";
import { queueWeeklyStockOutReport } from "@/lib/stock-out-report";
import { istanbulDate } from "@/lib/time";

// Daily jobs, then send the outbox. Vercel Cron sends Bearer $CRON_SECRET.
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return new Response("Yetkisiz", { status: 401 });
  await fillRecurringExpenses(istanbulDate(new Date()));
  const queued = [...(await queueFinanceReminders()), ...(await queueWeeklyStockOutReport()), ...(await queueActivityReports())];
  const processed = await processOutbox();
  return Response.json({ queued, processed });
}
