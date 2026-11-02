// Notion-style sorting shared by every list: several levels, and numbers inside text in number order ("EE9" before "EE12").

export type Sort = { id: string; desc: boolean };

const collator = new Intl.Collator("tr", { numeric: true, sensitivity: "base" });
const isEmpty = (value: unknown) => value === null || value === undefined || value === "";

export function compareValues(a: unknown, b: unknown): number {
  if (isEmpty(a) || isEmpty(b)) return Number(isEmpty(a)) - Number(isEmpty(b));
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return collator.compare(String(a), String(b));
}

// Empty values stay last in both directions; rows that tie keep their order.
export function sortRows<T>(rows: T[], sorts: Sort[], valueOf: (row: T, id: string) => unknown): T[] {
  return [...rows].sort((x, y) => {
    for (const { id, desc } of sorts) {
      const a = valueOf(x, id);
      const b = valueOf(y, id);
      if (isEmpty(a) !== isEmpty(b)) return isEmpty(a) ? 1 : -1;
      const order = compareValues(a, b);
      if (order !== 0) return desc ? -order : order;
    }
    return 0;
  });
}
