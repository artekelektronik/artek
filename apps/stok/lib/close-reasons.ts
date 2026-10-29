// Why a suggestion couldn't be done; kept apart from the database so client forms can use it.
// `status` is what the Müşteri becomes; "kapandi" and "ilgilenmiyor" are never suggested again.
export const closeReasons = {
  ulasilamadi: { label: "Ulaşılamadı", status: "ulasilamadi" },
  kapandi: { label: "Şirket kapanmış", status: "kapandi" },
  unvan_degisti: { label: "Unvanı / sahibi değişti", status: null },
  yanlis_iletisim: { label: "Yanlış numara / e-posta", status: null },
  ilgilenmiyor: { label: "İlgilenmiyor", status: "ilgilenmiyor" },
  rakip: { label: "Rakip firma", status: null },
  diger: { label: "Diğer (not yazın)", status: null },
} as const;
export type CloseReason = keyof typeof closeReasons;

// How long "Onay bekliyor" waits before Bugün asks "Onaylandı mı?" again.
export const askAgainDays = 3;
