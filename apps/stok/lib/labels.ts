import type { MovementType } from "./ledger";

export const movementTypeLabels: Record<MovementType, string> = {
  acilis: "Açılış",
  mal_kabul: "Mal kabul",
  transfer_sevk: "Transfer sevk",
  transfer_teslim: "Transfer teslim alma",
  transfer_kaybi: "Transfer kaybı",
  satis_teslimati: "Satış teslimatı",
  uretim_tuketimi: "Üretim tüketimi",
  fire: "Fire",
  sayim_duzeltmesi: "Sayım düzeltmesi",
};

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "short",
  timeStyle: "short",
});

export function formatDateTime(date: Date) {
  return dateTime.format(date);
}

// Quantities are stored with a dot; Turkish shows a decimal comma.
export function displayQuantity(value: string) {
  return value.replace(".", ",");
}
