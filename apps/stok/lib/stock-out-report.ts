import { and, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { lokasyon, notification, product, stockDocument, stockMovement, user, userPanel, userRole } from "../db/schema";
import { getRates, type Rates } from "./exchange-rates";
import { tl } from "./finance-calc";
import { appUrl, sentSince } from "./finance-reminders";
import { loadActor } from "./guard";
import { displayQuantity, formatDateTime, movementTypeLabels } from "./labels";
import { visibleLokasyonIds, type MovementType } from "./ledger";
import { can, type Actor } from "./permissions";
import { loadPrices } from "./prices";
import { addQuantities, formatQuantity, unitLabels, type Unit } from "./quantity";
import { stockOutTypes } from "./stock-out";
import { exitValue, type Price } from "./stock-value";
import { addDays, istanbulDate, istanbulTimeOn, weekStart } from "./time";

type Pricing = { prices: Map<string, Price>; rates: Rates | null };

// Priced at today's prices and rate, so an exit recorded before its price was entered gets its amount too.
const loadPricing = async (): Promise<Pricing> => {
  const [prices, rates] = await Promise.all([loadPrices(), getRates()]);
  return { prices, rates };
};

// Movement id to TL for a Finans paneli holder; undefined for anyone else, so no price leaves the server.
export async function exitValues(actor: Actor, movements: { id: string; type: string; quantity: string; productId: string }[]) {
  if (!can(actor, "finance.view")) return undefined;
  const { prices, rates } = await loadPricing();
  return Object.fromEntries(movements.map((m) => [m.id, exitValue(m.type, m.quantity, prices.get(m.productId), rates)]));
}

// Exits and corrections that lowered stock. A reversed one and its reversal count as if nothing happened.
async function listStockOuts(from: Date, to: Date, visible: string[] | undefined, pricing: Pricing | null) {
  const rows = await db
    .select({
      id: stockMovement.id,
      createdAt: stockMovement.createdAt,
      type: stockMovement.type,
      quantity: stockMovement.quantity,
      unit: stockMovement.unit,
      reason: stockMovement.reason,
      reference: stockDocument.reference,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      productCategory: product.category,
      lokasyonName: lokasyon.name,
      userName: user.name,
    })
    .from(stockMovement)
    .innerJoin(product, eq(product.id, stockMovement.productId))
    .innerJoin(user, eq(user.id, stockMovement.userId))
    .innerJoin(stockDocument, eq(stockDocument.id, stockMovement.documentId))
    .innerJoin(lokasyon, eq(lokasyon.id, stockMovement.lokasyonId))
    .where(
      and(
        gte(stockMovement.createdAt, from),
        lt(stockMovement.createdAt, to),
        inArray(stockMovement.type, [...stockOutTypes, "sayim_duzeltmesi"]),
        sql`${stockMovement.quantity} < 0`,
        isNull(stockMovement.reversesId),
        sql`not exists (select 1 from stock_movement r where r.reverses_id = ${stockMovement.id})`,
        visible ? (visible.length ? inArray(stockMovement.lokasyonId, visible) : sql`false`) : undefined,
      ),
    )
    .orderBy(sql`${stockMovement.createdAt} desc`);
  return rows.map((r) => ({
    ...r,
    quantity: formatQuantity(r.quantity).replace("-", ""),
    value: pricing ? exitValue(r.type, r.quantity, pricing.prices.get(r.productId), pricing.rates) : null,
  }));
}

type Row = Awaited<ReturnType<typeof listStockOuts>>[number];

function totalsPerUnit(rows: Row[]) {
  const totals = new Map<Unit, string>();
  for (const r of rows) totals.set(r.unit, addQuantities(totals.get(r.unit) ?? "0", r.quantity));
  return [...totals].map(([unit, value]) => ({ unit, value }));
}

export const perUnitText = (units: { unit: Unit; value: string }[]) =>
  units.map((u) => `${displayQuantity(u.value)} ${unitLabels[u.unit]}`).join(" · ") || "—";

// Types that carry an amount; the rest are never "unpriced".
const valued: MovementType[] = ["satis_teslimati", "uretim_tuketimi"];

function summarize(rows: Row[], priced: boolean) {
  const exits = rows.filter((r) => r.type !== "sayim_duzeltmesi");
  const byType = stockOutTypes.map((type) => {
    const lines = exits.filter((r) => r.type === type);
    const known = lines.filter((r) => r.value !== null);
    return {
      type,
      count: lines.length,
      units: totalsPerUnit(lines),
      value: known.length ? known.reduce((sum, r) => sum + r.value!, 0) : null,
      unpriced: priced && valued.includes(type) ? lines.length - known.length : 0,
    };
  });
  return { exits, corrections: rows.filter((r) => r.type === "sayim_duzeltmesi"), byType };
}

// This week's exits for the home page, from Monday on.
export async function getWeekStockOuts(headers: Headers, now = new Date()) {
  const actor = await loadActor(headers);
  const finance = can(actor, "finance.view");
  const start = weekStart(istanbulDate(now));
  const [visible, pricing] = await Promise.all([visibleLokasyonIds(actor), finance ? loadPricing() : null]);
  const rows = await listStockOuts(istanbulTimeOn(start), now, visible, pricing);
  return { from: start, finance, rows, summary: summarize(rows, finance) };
}

function lineText(r: Row, withAmounts: boolean) {
  return [
    formatDateTime(r.createdAt),
    `${r.productCode} ${r.productName}`,
    r.productCategory,
    `${displayQuantity(r.quantity)} ${unitLabels[r.unit]}`,
    r.lokasyonName,
    r.userName,
    movementTypeLabels[r.type],
    r.reason,
    r.reference,
    withAmounts && r.value !== null ? tl(r.value) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function reportBody(rows: Row[], from: string, to: string, withAmounts: boolean) {
  const { exits, corrections, byType } = summarize(rows, withAmounts);
  const link = `${appUrl()}/hareketler?baslangic=${from}&bitis=${to}`;
  if (rows.length === 0) return `Bu hafta stok çıkışı kaydedilmedi.\n\nStok hareketleri: ${link}`;

  const people = new Map<string, number>();
  for (const r of exits) people.set(r.userName, (people.get(r.userName) ?? 0) + 1);
  const products = new Map<string, Row[]>();
  for (const r of exits) products.set(r.productCode, [...(products.get(r.productCode) ?? []), r]);

  return [
    "Türe göre:",
    ...byType
      .filter((t) => t.count)
      .map((t) => {
        const amount = withAmounts && t.value !== null ? ` · ${tl(t.value)}` : "";
        const missing = withAmounts && t.unpriced ? ` (${t.unpriced} kayıtta fiyat yok)` : "";
        return `- ${movementTypeLabels[t.type]}: ${t.count} kayıt · ${perUnitText(t.units)}${amount}${missing}`;
      }),
    ...(exits.length ? ["", "Kişiye göre:", ...[...people].sort((a, b) => b[1] - a[1]).map(([name, n]) => `- ${name}: ${n} kayıt`)] : []),
    ...(exits.length
      ? ["", "Ürüne göre:", ...[...products.values()].map((l) => `- ${l[0].productCode} ${l[0].productName} (${l[0].productCategory}): ${perUnitText(totalsPerUnit(l))}`)]
      : []),
    ...(exits.length ? ["", "Tüm çıkışlar:", ...exits.map((r) => `- ${lineText(r, withAmounts)}`)] : []),
    ...(corrections.length ? ["", "Düzeltme veya sayımla azalanlar:", ...corrections.map((r) => `- ${lineText(r, false)}`)] : []),
    ...(withAmounts ? ["", "Tutarlar bugünkü fiyat ve TCMB kuruyla: satış satış fiyatıyla, üretim alış fiyatıyla hesaplandı."] : []),
    "",
    `Stok hareketleri: ${link}`,
  ].join("\n");
}

const kind = "stok_cikis_haftalik";

// Monday morning, from the daily cron: last week's exits to active admins. Amounts only to those with the Finans paneli.
export async function queueWeeklyStockOutReport(now = new Date()) {
  const today = istanbulDate(now);
  const monday = weekStart(today);
  if (today !== monday || (await sentSince(kind, istanbulTimeOn(monday)))) return [];

  const from = addDays(monday, -7);
  const to = addDays(monday, -1);
  const admins = await db
    .selectDistinct({ email: user.email, level: userPanel.level })
    .from(user)
    .innerJoin(userRole, and(eq(userRole.userId, user.id), eq(userRole.role, "admin")))
    .leftJoin(userPanel, and(eq(userPanel.userId, user.id), eq(userPanel.panel, "finans")))
    .where(isNull(user.deactivatedAt));
  const holdsFinance = (a: { level: string | null }) => a.level === "gorur" || a.level === "duzenler";
  const withAmounts = admins.filter(holdsFinance).map((a) => a.email).sort();
  const without = admins.filter((a) => !holdsFinance(a)).map((a) => a.email).sort();

  const pricing = withAmounts.length ? await loadPricing() : null;
  const rows = await listStockOuts(istanbulTimeOn(from), istanbulTimeOn(monday), undefined, pricing);
  const subject = `Haftalık stok çıkışı: ${from.slice(8, 10)}.${from.slice(5, 7)} – ${to.slice(8, 10)}.${to.slice(5, 7)} (${rows.filter((r) => r.type !== "sayim_duzeltmesi").length} kayıt)`;

  const emails = [
    { recipients: withAmounts, body: reportBody(rows, from, to, true) },
    { recipients: without, body: reportBody(rows, from, to, false) },
  ].filter((e) => e.recipients.length);
  if (emails.length === 0) {
    await db.insert(notification).values({
      status: "failed",
      lastError: "Alıcı yok: etkin yönetici bulunmuyor.",
      createdAt: now,
      kind,
      subject,
      body: reportBody(rows, from, to, false),
      recipients: [],
    });
  } else {
    await db.insert(notification).values(emails.map((e) => ({ createdAt: now, kind, subject, ...e })));
  }
  return [kind];
}
