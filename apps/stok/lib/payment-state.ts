// Whether a sale is paid; pure, so the screens and the server read it the same way (ADR-0008).

// Sales dated before this were never tracked; they count as paid unless payments are recorded on them.
export const paymentsTrackedFrom = "2026-11-01";

export const paymentMethodLabels = { nakit: "Nakit", havale: "Havale / EFT", kredi_karti: "Kredi kartı", cek_senet: "Çek / senet" } as const;
export type PaymentMethod = keyof typeof paymentMethodLabels;

export type PaymentState = "bekliyor" | "kismi" | "odendi";
export const paymentStateLabels: Record<PaymentState, string> = { bekliyor: "Ödeme bekliyor", kismi: "Kısmen ödendi", odendi: "Ödendi" };

export function paymentState(total: number, paid: number, issuedOn: string): PaymentState {
  if (paid >= total - 0.005 || (paid === 0 && issuedOn < paymentsTrackedFrom)) return "odendi";
  return paid > 0 ? "kismi" : "bekliyor";
}
