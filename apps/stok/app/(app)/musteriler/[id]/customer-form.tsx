"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Textarea } from "@artek/ui/components/textarea";
import { DatePicker } from "@/components/date-picker";
import { FormSelect } from "@/components/form-select";
import { FormStatus } from "@/components/form-status";
import { customerStatusLabels, type CustomerStatus } from "@/lib/finance-calc";
import { addNoteAction, updateCustomerAction } from "./actions";

type Editable = {
  id: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  about: string | null;
  contactSource: string | null;
  status: CustomerStatus;
  nextFollowUpOn: string | null;
};

export function CustomerForm({ customer }: { customer: Editable }) {
  const [state, formAction, pending] = useActionState(updateCustomerAction, undefined);
  const field = (name: keyof Editable, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Label className="flex-col items-stretch gap-1">
      {label}
      <Input id={`musteri-${name}`} name={name} defaultValue={customer[name] ?? ""} className="font-normal" {...props} />
    </Label>
  );
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={customer.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Label className="flex-col items-stretch gap-1">
          Durum
          <FormSelect
            name="status"
            defaultValue={customer.status}
            options={Object.entries(customerStatusLabels).map(([value, label]) => ({ value, label }))}
            className="w-full"
          />
        </Label>
        <Label className="flex-col items-stretch gap-1">
          Sonraki takip
          <DatePicker id="musteri-takip" name="nextFollowUpOn" defaultValue={customer.nextFollowUpOn ?? undefined} />
        </Label>
        {field("phone", "Telefon", { inputMode: "tel" })}
        {field("email", "E-posta", { type: "email" })}
        {field("website", "Web sitesi")}
        {field("contactSource", "İletişim bilgisinin kaynağı")}
      </div>
      <Label className="flex-col items-stretch gap-1">
        Ne yapıyor
        <Textarea id="musteri-about" name="about" defaultValue={customer.about ?? ""} rows={2} className="font-normal" />
      </Label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          Kaydet
        </Button>
        <FormStatus state={state} saved="Müşteri kaydedildi." />
      </div>
    </form>
  );
}

export function NoteForm({ customerId }: { customerId: string }) {
  const [state, formAction, pending] = useActionState(addNoteAction, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="customerId" value={customerId} />
      <Label htmlFor="musteri-not" className="sr-only">
        Not
      </Label>
      <Textarea id="musteri-not" name="body" rows={3} placeholder="Görüşmede ne konuşuldu, ne söz verildi?" />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>
          Not ekle
        </Button>
        <FormStatus state={state} saved="Not eklendi." />
      </div>
    </form>
  );
}
