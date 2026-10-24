import { and, asc, count, eq, gte, inArray, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "../db";
import { lokasyon, product, stock, stockCount, stockMovement, transfer } from "../db/schema";
import { requirePermission } from "./guard";
import { listMovements, visibleLokasyonIds } from "./ledger";
import { formatQuantity } from "./quantity";

export const dashboardDays = 14;
const dayMs = 24 * 60 * 60_000;

// The start of `date`'s day in Istanbul (UTC+3, no daylight saving).
function istanbulDayStart(date: Date) {
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(date);
  return new Date(`${day}T00:00:00+03:00`);
}

// The home page: what needs attention and what moved, limited to the Lokasyon the user may see.
export async function getDashboard(headers: Headers, now = new Date()) {
  // Every role may open it; what it counts is decided by Lokasyon visibility below.
  const actor = await requirePermission(headers, "products.view");
  const visible = await visibleLokasyonIds(actor); // undefined: every Lokasyon
  const within = (column: AnyPgColumn): SQL | undefined =>
    visible ? (visible.length ? inArray(column, visible) : sql`false`) : undefined;
  // Kritik seviye compares the company total, so only users who see every Lokasyon get it (as in the overview).
  const seesAll = visible === undefined;

  // Movements at a Lokasyon; the "on the way" half of a transfer is not a receipt or an issue.
  const atALokasyon = and(isNotNull(stockMovement.lokasyonId), within(stockMovement.lokasyonId));

  const today = istanbulDayStart(now);
  const since = new Date(today.getTime() - (dashboardDays - 1) * dayMs);
  // Qualified by hand: in a select list Drizzle writes the column unqualified, and inside the
  // subquery a bare "id" would be the movement's own id.
  const companyTotal = sql<string>`coalesce((select sum(m.quantity) from stock_movement m where m.product_id = "product"."id"), 0)`;

  const [[products], places, stocked, [onTheWay], [openCounts], [movedToday], perDay, below, recent] = await Promise.all([
    db.select({ n: count() }).from(product).where(isNull(product.archivedAt)),
    db.select().from(lokasyon).where(within(lokasyon.id)).orderBy(asc(lokasyon.name)),
    db
      .select({ lokasyonId: stock.lokasyonId, n: count() })
      .from(stock)
      .where(and(sql`${stock.physical} > 0`, within(stock.lokasyonId)))
      .groupBy(stock.lokasyonId),
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
    db
      .select({
        day: sql<string>`to_char(${stockMovement.createdAt} at time zone 'Europe/Istanbul', 'YYYY-MM-DD')`,
        inbound: sql<number>`(count(*) filter (where ${stockMovement.quantity} > 0))::int`,
        outbound: sql<number>`(count(*) filter (where ${stockMovement.quantity} < 0))::int`,
      })
      .from(stockMovement)
      .where(and(gte(stockMovement.createdAt, since), atALokasyon))
      .groupBy(sql`1`),
    seesAll
      ? db
          .select({ id: product.id, code: product.code, name: product.name, unit: product.unit, minLevel: product.minLevel, total: companyTotal })
          .from(product)
          .where(and(isNull(product.archivedAt), isNotNull(product.minLevel), sql`${companyTotal} < ${product.minLevel}`))
          .orderBy(asc(product.code))
      : Promise.resolve(null),
    listMovements(headers, {}),
  ]);

  const stockedBy = new Map(stocked.map((s) => [s.lokasyonId, s.n]));
  const countsBy = new Map(perDay.map((d) => [d.day, d]));
  const daily = Array.from({ length: dashboardDays }, (_, i) => {
    const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(new Date(since.getTime() + i * dayMs));
    return { day, inbound: countsBy.get(day)?.inbound ?? 0, outbound: countsBy.get(day)?.outbound ?? 0 };
  });

  return {
    productCount: products.n,
    lokasyon: places.map((l) => ({ id: l.id, name: l.name, openedAt: l.openedAt, stockedProducts: stockedBy.get(l.id) ?? 0 })),
    transfersOnTheWay: onTheWay.n,
    openCounts: openCounts.n,
    movementsToday: movedToday.n,
    daily,
    belowMinimum: below?.map((p) => ({ ...p, total: formatQuantity(p.total), minLevel: formatQuantity(p.minLevel!) })) ?? null,
    recent: recent.slice(0, 8),
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
