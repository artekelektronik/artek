// Whether a sale is paid, and what a payment may hold; pure, so the screens and the server agree (ADR-0008).
import { z } from "zod";
import type { paymentMethod } from "../db/schema";
import { decimalText } from "./decimal";

// Sales dated before this were never tracked; they count as paid unless payments are recorded on them.
export const paymentsTrackedFrom = "2026-11-01";

export type PaymentMethod = (typeof paymentMethod.enumValues)[number];
export const paymentMethodLabels: Record<PaymentMethod, string> = { nakit: "Nakit", havale: "Havale / EFT", kredi_karti: "Kredi kartı", cek_senet: "Çek / senet" };

export const paymentInput = z.object({
  paidOn: z.iso.date({ error: "Tarihi seçin." }),
  amount: decimalText("Tutarı yazın.").refine((v) => Number(v) > 0, { error: "Tutarı yazın." }),
  method: z.enum(Object.keys(paymentMethodLabels) as [PaymentMethod, ...PaymentMethod[]], { error: "Ödeme şeklini seçin." }),
  note: z.string().trim().max(300).default(""),
});
export type PaymentInput = z.input<typeof paymentInput>;

export type PaymentState = "bekliyor" | "kismi" | "odendi";
export const paymentStateLabels: Record<PaymentState, string> = { bekliyor: "Ödeme bekliyor", kismi: "Kısmen ödendi", odendi: "Ödendi" };

// What is still owed; under half a kuruş is nothing.
export const owed = (total: number, paid: number) => (total - paid > 0.005 ? total - paid : 0);

export function paymentState(total: number, paid: number, issuedOn: string): PaymentState {
  if (!owed(total, paid) || (paid === 0 && issuedOn < paymentsTrackedFrom)) return "odendi";
  return paid > 0 ? "kismi" : "bekliyor";
}
