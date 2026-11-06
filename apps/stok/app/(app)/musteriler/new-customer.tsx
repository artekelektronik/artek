"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@artek/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@artek/ui/components/dialog";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { addCustomerAction } from "./actions";

// "Yeni müşteri": a Müşteri needs its VKN so later invoices join it; without one, the firm is saved as an Aday.
export function NewCustomer() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus /> Yeni müşteri
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">{open && <NewCustomerForm onDone={() => setOpen(false)} />}</DialogContent>
    </Dialog>
  );
}

function NewCustomerForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [taxId, setTaxId] = useState("");
  const [, action, pending] = useActionState(async (previous: unknown, formData: FormData) => {
    const result = await addCustomerAction(previous, formData);
    if (result.error) toast.error(result.error);
    else if (result.saved && result.id) {
      const href = result.as === "aday" ? `/musteriler/adaylar?secili=${result.id}` : `/musteriler?secili=${result.id}`;
      toast.success(result.as === "aday" ? "Aday olarak eklendi." : "Müşteri eklendi.", {
        action: { label: "Kartı aç", onClick: () => router.push(href) },
      });
      onDone();
    }
    return result;
  }, undefined);

  const field = (name: string, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Label className="flex-col items-stretch gap-1 font-normal">
      {label}
      <Input name={name} {...props} />
    </Label>
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Yeni müşteri</DialogTitle>
        <DialogDescription>
          Vergi numarası, faturaları gelince müşteriyle eşleşmesi için gerekli. Bilmiyorsan firmayı aday olarak kaydet; ilk faturası gelince bağlanır.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", "Firma unvanı", { required: true, autoFocus: true, placeholder: "Ör. ÖRNEK ELEKTRONİK LTD. ŞTİ." })}
        <Label className="flex-col items-stretch gap-1 font-normal">
          Vergi numarası (VKN / TCKN)
          <Input name="taxId" inputMode="numeric" value={taxId} onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ""))} placeholder="10 ya da 11 hane" />
        </Label>
        {field("city", "Şehir")}
        {field("phone", "Telefon")}
        {field("email", "E-posta", { type: "email" })}
        {field("website", "Web sitesi")}
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Vazgeç
          </Button>
        </DialogClose>
        {taxId ? (
          <Button type="submit" name="as" value="musteri" disabled={pending}>
            Müşteri olarak kaydet
          </Button>
        ) : (
          <Button type="submit" name="as" value="aday" disabled={pending}>
            VKN yok, aday olarak kaydet
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}
