"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { DatePicker } from "@/components/date-picker";
import { FormSelect } from "@/components/form-select";
import { toastResult } from "@/components/form-status";
import { day, tl } from "@/lib/finance-calc";
import type { InvoiceReview } from "@/lib/invoices";
import { paymentMethodLabels, paymentState, paymentStateLabels, type PaymentMethod } from "@/lib/payment-state";
import { addPaymentAction, deletePaymentAction } from "./actions";

const methodOptions = Object.entries(paymentMethodLabels).map(([value, label]) => ({ value, label }));

// Tahsilat of one sale; not a <form>, because it sits inside the invoice's confirm form.
export function SalePayments({ review, canEdit, today }: { review: InvoiceReview; canEdit: boolean; today: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [paidOn, setPaidOn] = useState(today);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("havale");
  const [note, setNote] = useState("");
  const total = Number(review.totalAmount);
  const paid = review.payments.reduce((s, p) => s + Number(p.amount), 0);
  const state = paymentState(total, paid, review.issuedOn);

  const add = () =>
    start(async () => {
      if (!toastResult(await addPaymentAction(review.id, { paidOn, amount, method, note }), "Tahsilat eklendi.")) return;
      setAmount("");
      setNote("");
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
        Toplam {tl(total)} (KDV dahil) · Ödenen {tl(paid)} · Kalan {tl(Math.max(0, total - paid))}
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
      {canEdit && total - paid > 0.005 && (
        <div className="grid items-end gap-2 sm:grid-cols-[auto_8rem_10rem_1fr_auto]">
          <Label className="flex-col items-stretch gap-1 text-xs">
            Tarih
            <DatePicker name="paidOn" defaultValue={today} onChange={setPaidOn} />
          </Label>
          <Label className="flex-col items-stretch gap-1 text-xs">
            Tutar
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder={String(Math.round((total - paid) * 100) / 100).replace(".", ",")} className="font-normal tabular-nums" />
          </Label>
          <Label className="flex-col items-stretch gap-1 text-xs">
            Şekli
            <FormSelect name="method" options={methodOptions} defaultValue={method} onValueChange={(v) => setMethod(v as PaymentMethod)} className="w-full" />
          </Label>
          <Label className="flex-col items-stretch gap-1 text-xs">
            Not
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dekont no, banka…" className="font-normal" />
          </Label>
          <Button type="button" disabled={pending || !amount} onClick={add}>
            Ekle
          </Button>
        </div>
      )}
    </section>
  );
}
