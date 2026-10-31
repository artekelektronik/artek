"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { FormStatus } from "@/components/form-status";
import { addCustomerAction } from "./actions";

// "Yeni müşteri": a Müşteri needs its VKN so later invoices join it; without one, the firm is saved as an Aday.
export function NewCustomer() {
  const [open, setOpen] = useState(false);
  const [taxId, setTaxId] = useState("");
  const [state, action, pending] = useActionState(addCustomerAction, undefined);

  if (!open)
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus /> Yeni müşteri
      </Button>
    );
  const field = (name: string, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Label className="flex-col items-stretch gap-1 text-xs font-normal">
      {label}
      <Input name={name} {...props} />
    </Label>
  );
  const done = state?.saved && state.id;
  return (
    <form action={action} className="bg-card flex w-full flex-col gap-3 rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", "Firma unvanı", { required: true, placeholder: "Ör. ÖRNEK ELEKTRONİK LTD. ŞTİ." })}
        <Label className="flex-col items-stretch gap-1 text-xs font-normal">
          Vergi numarası (VKN / TCKN)
          <Input name="taxId" inputMode="numeric" value={taxId} onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ""))} placeholder="10 ya da 11 hane" />
        </Label>
        {field("city", "Şehir")}
        {field("phone", "Telefon")}
        {field("email", "E-posta", { type: "email" })}
        {field("website", "Web sitesi")}
      </div>
      <p className="text-muted-foreground text-xs">
        Vergi numarası, faturaları gelince müşteriyle eşleşmesi için gerekli. Bilmiyorsan firmayı aday olarak kaydet; ilk faturası gelince bağlanır.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {taxId ? (
          <Button type="submit" name="as" value="musteri" disabled={pending}>
            Müşteri olarak kaydet
          </Button>
        ) : (
          <Button type="submit" name="as" value="aday" disabled={pending}>
            VKN yok, aday olarak kaydet
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Kapat
        </Button>
        {done ? (
          <a
            href={state.as === "aday" ? `/musteriler/adaylar?secili=${state.id}` : `/musteriler?secili=${state.id}`}
            className="text-sm underline underline-offset-4"
          >
            Eklendi, kartı aç
          </a>
        ) : (
          <FormStatus state={state} />
        )}
      </div>
    </form>
  );
}
