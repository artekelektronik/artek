import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { notification, user, userPanel, userRole } from "../db/schema";
import { loadActivity, mayShow, type ActivityAccess, type ActivityEntry } from "./activity";
import { appUrl, sentSince } from "./finance-reminders";
import { activityEntityLabels } from "./labels";
import { addDays, istanbulDate, istanbulTimeOn } from "./time";

// The morning emails to admins: every day what was done yesterday, every Monday what mattered last week.
// Each admin reads only what their panels allow, so prices never reach someone without the Finans paneli.

const maxLines = 60;
const dayText = (day: string) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
const timeText = (at: Date) => at.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
const dateTimeText = (at: Date) => `${dayText(istanbulDate(at))} ${timeText(at)}`;

function countBy<T>(rows: T[], key: (row: T) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

function byPerson(rows: ActivityEntry[]) {
  return countBy(rows, (r) => r.who).map(([who, n]) => {
    const areas = countBy(rows.filter((r) => r.who === who), (r) => activityEntityLabels[r.entity]);
    return `- ${who}: ${n} işlem (${areas.map(([area, count]) => `${area} ${count}`).join(", ")})`;
  });
}

const line = (r: ActivityEntry, when: string) => `- ${when} · ${r.who} · ${activityEntityLabels[r.entity]} · ${r.actionLabel} · ${r.label}${r.detail ? ` · ${r.detail}` : ""}`;

function capped(lines: string[]) {
  return lines.length > maxLines ? [...lines.slice(0, maxLines), `… ve ${lines.length - maxLines} işlem daha.`] : lines;
}

export function dailyBody(rows: ActivityEntry[]) {
  return [
    "Kim ne kadar yaptı:",
    ...byPerson(rows),
    "",
    "Yapılanlar:",
    ...capped(rows.map((r) => line(r, timeText(r.at)))),
    "",
    `Tüm işlem geçmişi: ${appUrl()}/islem-gecmisi`,
  ].join("\n");
}

export function weeklyBody(rows: ActivityEntry[]) {
  const notable = rows.filter((r) => r.notable);
  return [
    "Kim ne kadar yaptı:",
    ...byPerson(rows),
    ...(notable.length ? ["", "Dikkat edilmesi gerekenler (silinen, geri alınan, düzeltilen, kullanıcı değişiklikleri):", ...capped(notable.map((r) => line(r, dateTimeText(r.at))))] : []),
    "",
    `Tüm işlem geçmişi: ${appUrl()}/islem-gecmisi`,
  ].join("\n");
}

async function adminAccess() {
  const rows = await db
    .select({ email: user.email, panel: userPanel.panel })
    .from(user)
    .innerJoin(userRole, and(eq(userRole.userId, user.id), eq(userRole.role, "admin")))
    .leftJoin(userPanel, eq(userPanel.userId, user.id))
    .where(isNull(user.deactivatedAt));
  const admins = new Map<string, ActivityAccess>();
  for (const { email, panel } of rows) {
    const access = admins.get(email) ?? { finance: false, crm: false };
    admins.set(email, { finance: access.finance || panel === "finans", crm: access.crm || panel === "musteri" });
  }
  return admins;
}

async function queueReport(kind: string, subject: (count: number) => string, body: (rows: ActivityEntry[]) => string, from: Date, to: Date, now: Date) {
  const everything = await loadActivity({ finance: true, crm: true }, { from, to }, 5000);
  if (everything.length === 0) return false; // a quiet day sends nothing
  const emails = new Map<string, { recipients: string[]; rows: ActivityEntry[] }>();
  for (const [email, access] of await adminAccess()) {
    const key = `${access.finance}:${access.crm}`;
    const group = emails.get(key) ?? { recipients: [], rows: everything.filter((r) => mayShow(r.entity, access)) };
    group.recipients.push(email);
    emails.set(key, group);
  }
  const values = [...emails.values()]
    .filter((e) => e.rows.length)
    .map((e) => ({ createdAt: now, kind, subject: subject(e.rows.length), body: body(e.rows), recipients: e.recipients.sort() }));
  if (values.length) await db.insert(notification).values(values);
  return values.length > 0;
}

// Run by the daily cron; each report goes out once however many times the cron runs.
export async function queueActivityReports(now = new Date()) {
  const queued: string[] = [];
  const today = istanbulDate(now);
  const midnight = istanbulTimeOn(today);

  const yesterday = addDays(today, -1);
  if (!(await sentSince("islem_gunluk", midnight))) {
    const sent = await queueReport("islem_gunluk", (n) => `Dün yapılanlar (${dayText(yesterday)}): ${n} işlem`, dailyBody, istanbulTimeOn(yesterday), midnight, now);
    if (sent) queued.push("islem_gunluk");
  }

  const isMonday = new Date(`${today}T12:00:00Z`).getUTCDay() === 1;
  if (isMonday && !(await sentSince("islem_haftalik", midnight))) {
    const start = addDays(today, -7);
    const sent = await queueReport("islem_haftalik", (n) => `Geçen hafta (${dayText(start)} – ${dayText(yesterday)}): ${n} işlem`, weeklyBody, istanbulTimeOn(start), midnight, now);
    if (sent) queued.push("islem_haftalik");
  }
  return queued;
}
