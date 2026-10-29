// The answers to "Sonuç ne oldu?"; kept apart from the database so client forms can use them.
export const outcomeLabels = {
  cevap_geldi: "Cevap geldi",
  teklif: "Teklif istendi / verildi",
  siparis: "Sipariş geldi",
  cevap_yok: "Cevap yok",
  ilgilenmiyor: "İlgilenmiyor",
  girilmedi: "Sonuç girilmedi",
} as const;
export type Outcome = keyof typeof outcomeLabels;

// Working days after an email or call before Bugün asks, and again after each "Sonra sor".
export const resultAfterWorkingDays = 3;
// "Sonra sor" this many times; the next time it is recorded as "girilmedi".
export const maxResultReasks = 2;
