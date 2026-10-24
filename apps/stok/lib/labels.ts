import type { countStatus, notificationStatus, transferStatus } from "../db/schema";
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

export const auditActionLabels: Record<string, string> = {
  "user.first_admin": "İlk yönetici oluşturuldu",
  "user.invite": "Davet edildi",
  "user.access": "Yetkiler değişti",
  "user.deactivate": "Devre dışı bırakıldı",
  "user.reactivate": "Yeniden etkinleştirildi",
  "user.password_link": "Şifre bağlantısı gönderildi",
  "user.password_set": "Şifresini belirledi",
  "user.sessions_ended": "Oturumları kapatıldı",
};

export const notificationStatusLabels: Record<(typeof notificationStatus.enumValues)[number], string> = {
  pending: "Bekliyor",
  sent: "Gönderildi",
  failed: "Gönderilemedi",
};

export const countKindLabels: Record<CountKind, string> = { sayim: "Sayım", acilis: "Açılış sayımı" };

export const countStatusLabels: Record<(typeof countStatus.enumValues)[number], string> = {
  taslak: "Açık",
  onaylandi: "Onaylandı",
  iptal: "İptal",
};

export const transferStatusLabels: Record<(typeof transferStatus.enumValues)[number], string> = {
  yolda: "Yolda",
  teslim_alindi: "Teslim alındı",
};

export const userStatusLabels = { etkin: "Etkin", davet: "Davet bekliyor", pasif: "Devre dışı" } as const;

export function userStatus(user: { active: boolean; invited: boolean }): keyof typeof userStatusLabels {
  return !user.active ? "pasif" : user.invited ? "davet" : "etkin";
}

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
