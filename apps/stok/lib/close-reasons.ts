// Close reasons live in the close_reason table and people edit them; this file holds what client forms need.

export type CloseEffect = "kapandi" | "ilgilenmiyor" | "tekrar" | "not";
export type ReasonView = { id: string; label: string; effect: CloseEffect; days: number | null };

export const effectLabels: Record<CloseEffect, string> = {
  kapandi: "Bir daha önerme: şirket kapandı",
  ilgilenmiyor: "Bir daha önerme: ilgilenmiyor",
  tekrar: "Birkaç gün sonra tekrar öner",
  not: "Sadece not",
};

export const describeEffect = (r: { effect: CloseEffect; days: number | null }) =>
  r.effect === "tekrar" ? `${r.days} gün sonra tekrar öner` : effectLabels[r.effect];

// "Diğer" needs a note saying what happened.
export const otherReasonId = "diger";

// How long "Onay bekliyor" waits before Bugün asks "Onaylandı mı?" again.
export const askAgainDays = 3;

// The list migration 0015 starts with; tests put it back after emptying the database.
export const startingReasons: (ReasonView & { sortOrder: number })[] = [
  { id: "ulasilamadi", label: "Ulaşılamadı", effect: "tekrar", days: 7, sortOrder: 1 },
  { id: "kapandi", label: "Şirket kapanmış", effect: "kapandi", days: null, sortOrder: 2 },
  { id: "unvan_degisti", label: "Unvanı / sahibi değişti", effect: "not", days: null, sortOrder: 3 },
  { id: "yanlis_iletisim", label: "Yanlış numara / e-posta", effect: "not", days: null, sortOrder: 4 },
  { id: "ilgilenmiyor", label: "İlgilenmiyor", effect: "ilgilenmiyor", days: null, sortOrder: 5 },
  { id: "rakip", label: "Rakip firma", effect: "not", days: null, sortOrder: 6 },
  { id: otherReasonId, label: "Diğer (not yazın)", effect: "not", days: null, sortOrder: 7 },
];
