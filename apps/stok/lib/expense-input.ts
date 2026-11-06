// What a Gider form may hold; the server and the form check with the same rules. Pure, so the browser can import it.
import { z } from "zod";
import { normalizeDecimal } from "./decimal";

const decimal = (error: string) =>
  z.string().transform((raw, ctx) => {
    const value = normalizeDecimal(raw);
    if (value === null) ctx.addIssue({ code: "custom", message: error });
    return value ?? "";
  });

export const expenseInput = z.object({
  spentOn: z.iso.date({ error: "Tarihi seçin." }),
  category: z.string().trim().min(1, { error: "Kategori seçin." }),
  description: z.string().trim().max(500).default(""),
  party: z.string().trim().max(200).default(""),
  netAmount: decimal("Tutarı sayı olarak yazın.")
    .refine((v) => Number(v) > 0, { error: "Tutar sıfırdan büyük olmalı." })
    .refine((v) => v.split(".")[0].length <= 12, { error: "Tutar çok büyük." }),
  kdvRate: decimal("KDV oranı sayı olmalı.").refine((v) => Number(v) <= 100, { error: "KDV oranı 0–100 arası olmalı." }),
});
export type ExpenseInput = z.input<typeof expenseInput>;
