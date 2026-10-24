import { addQuantities, type Unit } from "./quantity";

type TotalsRow = { unit: Unit; stock: Record<string, { physical: string }>; inTransit: string; total: string };

// Adet and kg can't be added together, so the rows are totalled per unit.
export function totalsByUnit(rows: TotalsRow[], lokasyonIds: string[]) {
  return [...new Set(rows.map((r) => r.unit))].map((unit) => {
    const lines = rows.filter((r) => r.unit === unit);
    const sum = (pick: (r: TotalsRow) => string) => addQuantities(...lines.map(pick));
    return {
      unit,
      physical: Object.fromEntries(lokasyonIds.map((id) => [id, sum((r) => r.stock[id].physical)])),
      inTransit: sum((r) => r.inTransit),
      total: sum((r) => r.total),
    };
  });
}
