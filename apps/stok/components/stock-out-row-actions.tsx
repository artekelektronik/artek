"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@artek/ui/components/dropdown-menu";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { correctStockOutAction, deleteStockOutAction } from "@/app/(app)/stok-cikisi/actions";
import { FormDialog } from "@/components/form-dialog";
import type { ActionState } from "@/lib/action-result";
import { FormSelect } from "@/components/form-select";
import { toastResult } from "@/components/form-status";
import { displayQuantity, movementTypeLabels } from "@/lib/labels";
import { stockOutTypes } from "@/lib/stock-out-types";
import { unitLabels } from "@/lib/quantity";
import type { listMovements } from "@/lib/ledger";

type Movement = Awaited<ReturnType<typeof listMovements>>[number];

// Düzenle and Sil for a hand-made stock-out; a Fatura's stock-out links to its invoice instead.
export function StockOutRowActions({ movement: m }: { movement: Movement }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"duzenle" | "sil" | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const quantity = displayQuantity(m.quantity.replace("-", ""));
  const label = `${m.productCode} · ${quantity} ${unitLabels[m.unit]}`;

  if (m.documentKind === "fatura") {
    return (
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link href={`/faturalar?ara=${encodeURIComponent(m.reference ?? "")}`}>
          <FileText /> Fatura
        </Link>
      </Button>
    );
  }
  if (m.documentKind !== "stok_cikisi") return null;

  const done = (result: ActionState, message: string) => {
    if (!toastResult(result, message)) return false;
    setIdempotencyKey(crypto.randomUUID());
    router.refresh();
    return true;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label={`${label} için işlemler`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("duzenle")}>
            <Pencil /> Düzenle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("sil")}>
            <Trash2 /> Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialog
        open={dialog === "duzenle"}
        onOpenChange={(open) => setDialog(open ? "duzenle" : null)}
        className="sm:max-w-md"
        title="Stok çıkışını düzenle"
        description={`${m.productName} (${m.productCode}), ${m.lokasyonName}. Yanlış kayıt ters kaydedilir, doğrusu yeni çıkış olarak girer; ikisi de geçmişte kalır.`}
        submitLabel="Kaydet"
        onSubmit={async (formData) => {
          formData.set("idempotencyKey", idempotencyKey);
          return done(await correctStockOutAction(m.id, formData), "Stok çıkışı düzeltildi.");
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Label className="flex-col items-stretch gap-1">
            Tür
            <FormSelect name="type" options={stockOutTypes.map((t) => ({ value: t, label: movementTypeLabels[t] }))} defaultValue={m.type} className="w-full" />
          </Label>
          <Label className="flex-col items-stretch gap-1">
            Miktar ({unitLabels[m.unit]})
            <Input name="quantity" defaultValue={quantity} inputMode="decimal" className="font-normal tabular-nums" />
          </Label>
        </div>
        <Label className="flex-col items-stretch gap-1">
          Neden
          <Input name="reason" defaultValue={m.reason ?? ""} className="font-normal" />
        </Label>
        <Label className="flex-col items-stretch gap-1">
          Belge no (isteğe bağlı)
          <Input name="reference" defaultValue={m.reference ?? ""} className="font-normal" />
        </Label>
      </FormDialog>

      <FormDialog
        open={dialog === "sil"}
        onOpenChange={(open) => setDialog(open ? "sil" : null)}
        className="sm:max-w-md"
        title="Stok çıkışı silinsin mi?"
        description={`${label}, ${m.lokasyonName}. Stok geri eklenir; kayıt ters kaydıyla birlikte geçmişte kalır.`}
        submitLabel="Sil"
        pendingLabel="Siliniyor…"
        destructive
        onSubmit={async (formData) => {
          formData.set("idempotencyKey", idempotencyKey);
          return done(await deleteStockOutAction(m.id, formData), "Stok çıkışı silindi; stok geri eklendi.");
        }}
      />
    </>
  );
}
