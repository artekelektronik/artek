// "20.000,50", "20000,50" and "20000.50" all become "20000.50", as a numeric column stores it; null if it isn't a number.
export function normalizeDecimal(raw: string): string | null {
  const typed = raw.trim();
  const text = typed.includes(",") ? typed.replaceAll(".", "").replace(",", ".") : typed;
  return /^\d+(\.\d+)?$/.test(text) ? text : null;
}

// The other way: "12.5000" → "12,5", what a field shows.
export const displayDecimal = (stored: string) => stored.replace(/\.?0+$/, "").replace(".", ",");

export const decimalValue = (raw: string) => Number(normalizeDecimal(raw) ?? Number.NaN);
