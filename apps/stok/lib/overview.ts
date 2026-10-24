import { and, asc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "../db";
import { product, stock, transfer, transferLine } from "../db/schema";
import { loadActor } from "./guard";
import { listLokasyon } from "./lokasyon";
import { can } from "./permissions";
import { addQuantities, formatQuantity, subtractQuantity, type Unit } from "./quantity";

export type OverviewFilters = { q?: string; category?: string; lokasyonId?: string; belowMinimum?: boolean };

type Pile = { physical: string; reserved: string; available: string };
const empty: Pile = { physical: "0", reserved: "0", available: "0" };

// The daily stock overview: every active product with physical / reserved / available per Lokasyon,
// stock on the way, and totals per unit. Only Lokasyon the user may see appear, whatever is asked for.
export async function getOverview(headers: Headers, filters: OverviewFilters) {
  const actor = await loadActor(headers);
  const visible = (await listLokasyon()).filter((l) => can(actor, "stock.view", l.id));
  const shown = filters.lokasyonId ? visible.filter((l) => l.id === filters.lokasyonId) : visible;
  const shownIds = shown.map((l) => l.id);

  const search = filters.q?.trim();
  const products = await db
    .select({ id: product.id, code: product.code, name: product.name, category: product.category, unit: product.unit })
    .from(product)
    .where(
      and(
        isNull(product.archivedAt),
        filters.category ? eq(product.category, filters.category) : undefined,
        search ? or(ilike(product.code, `%${search}%`), ilike(product.name, `%${search}%`)) : undefined,
        // Below Kritik seviye: the company total of every movement, as the warning uses.
        filters.belowMinimum
          ? sql`${product.minLevel} is not null and (select coalesce(sum(m.quantity), 0) from stock_movement m where m.product_id = ${product.id}) < ${product.minLevel}`
          : undefined,
      ),
    )
    .orderBy(asc(product.code));

  const piles = shownIds.length ? await db.select().from(stock).where(inArray(stock.lokasyonId, shownIds)) : [];
  // On the way in open transfers that start or end at a Lokasyon shown here.
  const transit = shownIds.length
    ? await db
        .select({ productId: transferLine.productId, total: sql<string>`sum(${transferLine.sent})` })
        .from(transferLine)
        .innerJoin(transfer, eq(transfer.id, transferLine.transferId))
        .where(
          and(
            eq(transfer.status, "yolda"),
            or(inArray(transfer.fromLokasyonId, shownIds), inArray(transfer.toLokasyonId, shownIds)),
          ),
        )
        .groupBy(transferLine.productId)
    : [];

  const rows = products.map((p) => {
    const perLokasyon: Record<string, Pile> = {};
    for (const l of shown) {
      const pile = piles.find((s) => s.productId === p.id && s.lokasyonId === l.id);
      perLokasyon[l.id] = pile
        ? {
            physical: formatQuantity(pile.physical),
            reserved: formatQuantity(pile.reserved),
            available: subtractQuantity(pile.physical, pile.reserved),
          }
        : empty;
    }
    const inTransit = formatQuantity(transit.find((t) => t.productId === p.id)?.total ?? "0");
    const total = addQuantities(...Object.values(perLokasyon).map((s) => s.physical), inTransit);
    return { ...p, stock: perLokasyon, inTransit, total };
  });

  // Adet and kg can't be added together, so totals are per unit.
  const totals: Partial<Record<Unit, { stock: Record<string, Pile>; inTransit: string; total: string }>> = {};
  for (const unit of [...new Set(rows.map((r) => r.unit))]) {
    const lines = rows.filter((r) => r.unit === unit);
    const sum = (pick: (r: (typeof rows)[number]) => string) => addQuantities(...lines.map(pick));
    totals[unit] = {
      stock: Object.fromEntries(
        shown.map((l) => [
          l.id,
          {
            physical: sum((r) => r.stock[l.id].physical),
            reserved: sum((r) => r.stock[l.id].reserved),
            available: sum((r) => r.stock[l.id].available),
          },
        ]),
      ),
      inTransit: sum((r) => r.inTransit),
      total: sum((r) => r.total),
    };
  }

  return { lokasyon: shown.map((l) => ({ id: l.id, name: l.name })), rows, totals };
}

export type Overview = Awaited<ReturnType<typeof getOverview>>;
