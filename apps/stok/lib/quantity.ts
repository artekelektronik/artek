import type { unit } from "../db/schema";

export type Unit = (typeof unit.enumValues)[number];

export const unitLabels: Record<Unit, string> = {
  adet: "adet",
  takim: "takım",
  rulo: "rulo",
  kg: "kg",
  metre: "metre",
};

// Adet, takım and rulo are counted; kg and metre are measured to 3 decimals.
const decimals: Record<Unit, number> = { adet: 0, takim: 0, rulo: 0, kg: 3, metre: 3 };

export type ParsedQuantity = { ok: true; value: string } | { ok: false; error: string };

// Quantities have at most 3 decimals, so they are added exactly as integer thousandths.
function toThousandths(value: string) {
  const negative = value.trim().startsWith("-");
  const [whole, fraction = ""] = value.trim().replace("-", "").split(".");
  const amount = BigInt(whole || "0") * 1000n + BigInt((fraction + "000").slice(0, 3));
  return negative ? -amount : amount;
}

function fromThousandths(amount: bigint) {
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const fraction = String(abs % 1000n).padStart(3, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${abs / 1000n}${fraction ? `.${fraction}` : ""}`;
}

// "100.000" → "100", "12.340" → "12.34", "-30.000" → "-30".
export function formatQuantity(value: string) {
  return fromThousandths(toThousandths(value));
}

export function addQuantities(...values: string[]) {
  return fromThousandths(values.reduce((total, value) => total + toThousandths(value), 0n));
}

export function subtractQuantity(a: string, b: string) {
  return fromThousandths(toThousandths(a) - toThousandths(b));
}

// Parses a positive quantity typed by a user ("1,5" or "1.5") into the string the numeric column stores.
export function parseQuantity(raw: string, unit: Unit): ParsedQuantity {
  const text = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(text) || Number(text) <= 0) {
    return { ok: false, error: "Miktar sıfırdan büyük bir sayı olmalı." };
  }
  // The ledger stores numeric(14, 3): at most 11 digits before the decimal point.
  if (text.split(".")[0].replace(/^0+/, "").length > 11) return { ok: false, error: "Miktar çok büyük." };
  const fraction = text.split(".")[1] ?? "";
  if (fraction.length > decimals[unit]) {
    return {
      ok: false,
      error:
        decimals[unit] === 0
          ? `${unitLabels[unit]} için miktar tam sayı olmalı.`
          : `${unitLabels[unit]} için en fazla ${decimals[unit]} ondalık basamak girilebilir.`,
    };
  }
  return { ok: true, value: text };
}
