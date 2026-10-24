import type { CountKind } from "./counts";
import type { MovementType } from "./ledger";
import type { Role } from "./permissions";

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

export const roleLabels: Record<Role, string> = {
  admin: "Yönetici",
  muhendis: "Mühendis",
  magaza_sorumlusu: "Mağaza sorumlusu",
  depo_sorumlusu: "Depo sorumlusu",
};

export const notificationStatusLabels: Record<"pending" | "sent" | "failed", string> = {
  pending: "Bekliyor",
  sent: "Gönderildi",
  failed: "Gönderilemedi",
};

export const countKindLabels: Record<CountKind, string> = { sayim: "Sayım", acilis: "Açılış sayımı" };

export const countStatusLabels: Record<"taslak" | "onaylandi" | "iptal", string> = {
  taslak: "Açık",
  onaylandi: "Onaylandı",
  iptal: "İptal",
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
