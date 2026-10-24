import { and, asc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "../db";
import { product, stock, transfer, transferLine } from "../db/schema";
import { requirePermission } from "./guard";
import { listLokasyon } from "./lokasyon";
import { can } from "./permissions";
import { addQuantities, formatQuantity, subtractQuantity } from "./quantity";
import { belowMinimumLevel } from "./kritik-seviye";

type OverviewFilters = { q?: string; category?: string | string[]; lokasyonId?: string; belowMinimum?: boolean };

type Pile = { physical: string; reserved: string; available: string };
const empty: Pile = { physical: "0", reserved: "0", available: "0" };

// Active products with stock per visible Lokasyon (whatever is asked for) and stock on the way.
export async function getOverview(headers: Headers, filters: OverviewFilters) {
  const actor = await requirePermission(headers, "products.view");
  const all = await listLokasyon();
  const visible = all.filter((l) => can(actor, "stock.view", l.id));
  // The below-Kritik-seviye filter compares the company total, so it is only for users who see every Lokasyon.
  const belowMinimum = filters.belowMinimum && visible.length === all.length;
  const shown = filters.lokasyonId ? visible.filter((l) => l.id === filters.lokasyonId) : visible;
  const shownIds = shown.map((l) => l.id);

  const search = filters.q?.trim();
  const products = await db
    .select({ id: product.id, code: product.code, name: product.name, category: product.category, unit: product.unit })
    .from(product)
    .where(
      and(
        isNull(product.archivedAt),
        categoryCondition(filters.category),
        search ? or(ilike(product.code, `%${search}%`), ilike(product.name, `%${search}%`)) : undefined,
        belowMinimum ? belowMinimumLevel : undefined,
      ),
    )
    .orderBy(asc(product.code));

  const piles = shownIds.length ? await db.select().from(stock).where(inArray(stock.lokasyonId, shownIds)) : [];
  const pileOf = new Map(piles.map((s) => [`${s.productId}:${s.lokasyonId}`, s]));
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
      const pile = pileOf.get(`${p.id}:${l.id}`);
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

  return { lokasyon: shown.map((l) => ({ id: l.id, name: l.name })), rows, canFilterBelowMinimum: visible.length === all.length };
}

export type Overview = Awaited<ReturnType<typeof getOverview>>;

function categoryCondition(category: OverviewFilters["category"]) {
  const categories = [category ?? []].flat().filter(Boolean);
  return categories.length ? inArray(product.category, categories) : undefined;
}
