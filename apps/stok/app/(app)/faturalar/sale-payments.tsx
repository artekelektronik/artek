"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { z } from "zod";
import { Trash2 } from "lucide-react";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@artek/ui/components/form";
import { Input } from "@artek/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@artek/ui/components/select";
import { DatePicker } from "@/components/date-picker";
import { toastResult } from "@/components/form-status";
import { displayDecimal } from "@/lib/decimal";
import { day, money, tl } from "@/lib/finance-calc";
import type { InvoiceReview } from "@/lib/invoices";
import { owed, paymentInput, paymentMethodLabels, paymentState, paymentStateLabels, type PaymentInput } from "@/lib/payment-state";
import { addPaymentAction, deletePaymentAction } from "./actions";

// Tahsilat of one sale. No <form> element: it sits inside the invoice's confirm form, so the button submits it.
export function SalePayments({ review, canEdit, today }: { review: InvoiceReview; canEdit: boolean; today: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<PaymentInput, unknown, z.output<typeof paymentInput>>({
    resolver: standardSchemaResolver(paymentInput),
    defaultValues: { paidOn: today, amount: "", method: "havale", note: "" },
  });
  const total = Number(review.totalAmount);
  const paid = review.payments.reduce((s, p) => s + Number(p.amount), 0);
  const left = owed(total, paid);
  const state = paymentState(total, paid, review.issuedOn);

  const add = (values: z.output<typeof paymentInput>) =>
    start(async () => {
      if (!toastResult(await addPaymentAction(review.id, values), "Tahsilat eklendi.")) return;
      form.reset({ ...values, amount: "", note: "" });
      router.refresh();
    });
  const remove = (id: string) =>
    start(async () => {
      if (toastResult(await deletePaymentAction(id), "Tahsilat silindi.")) router.refresh();
    });

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Tahsilat</p>
        <Badge variant="outline">{paymentStateLabels[state]}</Badge>
      </div>
      <p className="text-muted-foreground text-xs tabular-nums">
        Toplam {tl(total)} (KDV dahil) · Ödenen {tl(paid)} · Kalan {tl(left)}
      </p>
      {review.payments.length > 0 && (
        <ul className="divide-y rounded-md border">
          {review.payments.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2">
              <span className="tabular-nums">{day(p.paidOn)}</span>
              <span className="text-muted-foreground">{paymentMethodLabels[p.method]}</span>
              <span className="text-muted-foreground min-w-0 flex-1 truncate">{p.note}</span>
              <span className="font-medium tabular-nums">{tl(Number(p.amount))}</span>
              {canEdit && (
                <Button type="button" variant="ghost" size="icon" className="size-7" disabled={pending} aria-label="Tahsilatı sil" onClick={() => remove(p.id)}>
                  <Trash2 />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && left > 0 && (
        <Form {...form}>
          <div
            className="grid items-start gap-2 sm:grid-cols-[auto_8rem_10rem_1fr_auto]"
            // Enter would otherwise submit the invoice's confirm form around it.
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              void form.handleSubmit(add)();
            }}
          >
            <FormField
              control={form.control}
              name="paidOn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tarih</FormLabel>
                  <DatePicker name={field.name} defaultValue={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tutar</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="decimal" placeholder={displayDecimal(money(left))} className="tabular-nums" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Şekli</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(paymentMethodLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Not</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Dekont no, banka…" />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="button" className="mt-5" disabled={pending} onClick={form.handleSubmit(add)}>
              Ekle
            </Button>
          </div>
        </Form>
      )}
    </section>
  );
}
