import { and, asc, count, eq, gte, inArray, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "../db";
import { lokasyon, product, stockCount, stockMovement, transfer } from "../db/schema";
import { getRates } from "./exchange-rates";
import { loadActor, requirePermission } from "./guard";
import { belowMinimumLevel, companyTotal } from "./kritik-seviye";
import { listMovements, visibleLokasyonIds } from "./ledger";
import { getOverview } from "./overview";
import { can } from "./permissions";
import { loadPrices } from "./prices";
import { formatQuantity } from "./quantity";
import { stockSummary, type Price } from "./stock-value";
import { addDays, istanbulDate, istanbulTimeOn } from "./time";

export async function getDashboard(headers: Headers, now = new Date()) {
  // Every role; what it counts depends on Lokasyon visibility.
  const actor = await requirePermission(headers, "products.view");
  const visible = await visibleLokasyonIds(actor); // undefined: every Lokasyon
  const within = (column: AnyPgColumn): SQL | undefined =>
    visible ? (visible.length ? inArray(column, visible) : sql`false`) : undefined;
  // Kritik seviye compares the company total, so only users who see every Lokasyon get it (as in the overview).
  const seesAll = visible === undefined;

  // Movements at a Lokasyon; the "on the way" half of a transfer is not a receipt or an issue.
  const atALokasyon = and(isNotNull(stockMovement.lokasyonId), within(stockMovement.lokasyonId));

  const today = istanbulTimeOn(istanbulDate(now));
  const sixMonthsAgo = istanbulTimeOn(`${addDays(`${istanbulDate(now).slice(0, 7)}-01`, -150).slice(0, 7)}-01`);
  const month = sql<string>`to_char(${stockMovement.createdAt} at time zone 'Europe/Istanbul', 'YYYY-MM')`;

  const [places, [onTheWay], [openCounts], [movedToday], below, [noMinimum], recent, monthly] = await Promise.all([
    db.select().from(lokasyon).where(within(lokasyon.id)).orderBy(asc(lokasyon.name)),
    db
      .select({ n: count() })
      .from(transfer)
      .where(
        and(
          eq(transfer.status, "yolda"),
          visible ? or(within(transfer.fromLokasyonId), within(transfer.toLokasyonId)) : undefined,
        ),
      ),
    db.select({ n: count() }).from(stockCount).where(and(eq(stockCount.status, "taslak"), within(stockCount.lokasyonId))),
    db.select({ n: count() }).from(stockMovement).where(and(gte(stockMovement.createdAt, today), atALokasyon)),
    seesAll
      ? db
          .select({ id: product.id, code: product.code, name: product.name, unit: product.unit, minLevel: product.minLevel, total: companyTotal })
          .from(product)
          .where(and(isNull(product.archivedAt), belowMinimumLevel))
          .orderBy(asc(product.code))
      : Promise.resolve(null),
    seesAll ? db.select({ n: count() }).from(product).where(and(isNull(product.archivedAt), isNull(product.minLevel))) : [null],
    listMovements(headers, { limit: 6 }),
    // Records in and out per month; adet and kg can't be added, so this counts movements.
    db
      .select({ month, in: sql<number>`count(*) filter (where ${stockMovement.quantity} > 0)::int`, out: sql<number>`count(*) filter (where ${stockMovement.quantity} < 0)::int` })
      .from(stockMovement)
      .where(and(gte(stockMovement.createdAt, sixMonthsAgo), atALokasyon))
      .groupBy(month)
      .orderBy(month),
  ]);

  return {
    lokasyon: places.map((l) => ({ id: l.id, name: l.name, openedAt: l.openedAt })),
    transfersOnTheWay: onTheWay.n,
    openCounts: openCounts.n,
    movementsToday: movedToday.n,
    // Most urgent first: furthest below its own level.
    belowMinimum:
      below
        ?.map((p) => ({ ...p, total: formatQuantity(p.total), minLevel: formatQuantity(p.minLevel!) }))
        .sort((a, b) => Number(a.total) / Number(a.minLevel) - Number(b.total) / Number(b.minLevel)) ?? null,
    noMinimumCount: noMinimum?.n ?? null,
    recent,
    monthly,
  };
}

// What is in stock, for the visible Lokasyonlar. Prices and rates are read only for a Finans paneli holder.
export async function getStockSummary(headers: Headers) {
  const actor = await loadActor(headers);
  const finance = can(actor, "finance.view");
  const [overview, prices, rates] = await Promise.all([
    getOverview(headers, {}),
    finance ? loadPrices() : new Map<string, Price>(),
    finance ? getRates() : null,
  ]);
  return { finance, rates, lokasyon: overview.lokasyon, ...stockSummary(overview.rows, overview.lokasyon.map((l) => l.id), prices, rates) };
}
