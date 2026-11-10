"use client";

import { useState, useTransition } from "react";
import { Link2 } from "lucide-react";
import { Alert, AlertDescription } from "@artek/ui/components/alert";
import { Button } from "@artek/ui/components/button";
import { FormSelect } from "@/components/form-select";
import { toastResult } from "@/components/form-status";
import { day, tl } from "@/lib/finance-calc";
import type { InvoiceReview } from "@/lib/invoices";
import { attachToProformaAction } from "./actions";
import { useFatura } from "./use-fatura";

// An uploaded e-Fatura for goods already sent on a proforma becomes that proforma (ADR-0008).
export function AttachProforma({ review }: { review: InvoiceReview }) {
  const [, setFatura] = useFatura();
  const [pending, start] = useTransition();
  const [picked, setPicked] = useState(review.openProformas.find((p) => p.sameBuyer)?.id ?? "");
  if (!review.openProformas.length) return null;
  const options = review.openProformas.map((p) => ({ value: p.id, label: `${p.number} · ${p.buyerName} · ${day(p.issuedOn)} · ${tl(Number(p.netAmount))}` }));

  return (
    <Alert>
      <Link2 />
      <AlertDescription className="flex flex-col gap-2">
        <span>Bu ürünler bir proformayla gönderildiyse e-Faturayı ona bağlayın: proforma bu faturanın numarasını ve PDF’ini alır, stok tekrar düşmez, tahsilatlar kalır.</span>
        <span className="flex flex-wrap items-center gap-2">
          <FormSelect name="proforma" options={options} defaultValue={picked} empty="Proforma seçin" onValueChange={setPicked} className="w-96 max-w-full" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !picked}
            onClick={() =>
              start(async () => {
                if (toastResult(await attachToProformaAction(review.id, picked), "e-Fatura proformaya bağlandı.")) await setFatura(picked);
              })
            }
          >
            Proformaya bağla
          </Button>
        </span>
      </AlertDescription>
    </Alert>
  );
}
