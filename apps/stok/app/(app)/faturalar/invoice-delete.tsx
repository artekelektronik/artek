"use client";

import { toastResult } from "@/components/form-status";
import { FormDialog } from "@/components/form-dialog";
import { deleteInvoiceAction } from "./actions";

export function DeleteInvoiceDialog({
  invoice,
  open,
  onOpenChange,
  onDeleted,
}: {
  invoice: { id: string; number: string; status: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-md"
      title={`${invoice.number} silinsin mi?`}
      description="Fatura, satırları ve PDF’i kalıcı olarak silinir; geri alınamaz."
      submitLabel="Sil"
      pendingLabel="Siliniyor…"
      destructive
      onSubmit={async () => {
        const deleted = toastResult(await deleteInvoiceAction(invoice.id), `${invoice.number} silindi.`);
        if (deleted) onDeleted();
        return deleted;
      }}
    >
      {invoice.status === "onaylandi" && (
        <p className="text-sm">Onaylı bir fatura: stoktan düşen ürünler ters kayıtla stoğa geri girer ve Finans toplamlarından çıkar.</p>
      )}
    </FormDialog>
  );
}
