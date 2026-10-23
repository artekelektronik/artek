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

// Parses a positive quantity typed by a user ("1,5" or "1.5") into the string the numeric column stores.
export function parseQuantity(raw: string, unit: Unit): ParsedQuantity {
  const text = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(text) || Number(text) <= 0) {
    return { ok: false, error: "Miktar sıfırdan büyük bir sayı olmalı." };
  }
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
