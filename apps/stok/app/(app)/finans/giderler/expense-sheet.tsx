"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { z } from "zod";
import { toast } from "sonner";
import { Button } from "@artek/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@artek/ui/components/form";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Textarea } from "@artek/ui/components/textarea";
import { Combobox } from "@/components/combobox";
import { FormSheet, SheetActions } from "@/components/form-sheet";
import { toastResult } from "@/components/form-status";
import { decimalValue, displayDecimal } from "@/lib/decimal";
import { expenseInput, withKdv } from "@/lib/expense-input";
import { tl } from "@/lib/finance-calc";
import { saveExpenseAction } from "./actions";
import { receiptUrl, useOpenExpense, type ExpenseRow } from "./expense-table";

type FormValues = z.input<typeof expenseInput>;

export function ExpenseSheet({ rows, categories, canEdit, today }: { rows: ExpenseRow[]; categories: string[]; canEdit: boolean; today: string }) {
  const [opened, setOpened] = useOpenExpense();
  const editing = opened && opened !== "yeni" ? rows.find((r) => r.id === opened) : undefined;
  const open = opened === "yeni" || Boolean(editing);
  return (
    <FormSheet open={open} onOpenChange={(next) => !next && setOpened(null)} title={editing ? "Gideri düzenle" : "Gider ekle"} description="Tutarlar KDV hariç girilir; KDV dahil tutar orandan hesaplanır.">
      {open && <ExpenseForm key={editing?.id ?? "yeni"} expense={editing} categories={categories} canEdit={canEdit} today={today} onDone={() => setOpened(null)} />}
    </FormSheet>
  );
}

function ExpenseForm({ expense, categories, canEdit, today, onDone }: { expense?: ExpenseRow; categories: string[]; canEdit: boolean; today: string; onDone: () => void }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const form = useForm<FormValues, unknown, z.output<typeof expenseInput>>({
    resolver: standardSchemaResolver(expenseInput),
    defaultValues: {
      spentOn: expense?.spentOn ?? today,
      category: expense?.category ?? "",
      party: expense?.party ?? "",
      description: expense?.description ?? "",
      netAmount: expense ? displayDecimal(expense.netAmount) : "",
      kdvRate: expense ? displayDecimal(expense.kdvRate) : "20",
    },
    disabled: !canEdit,
  });
  const [net, rate] = useWatch({ control: form.control, name: ["netAmount", "kdvRate"] });
  const total = withKdv(decimalValue(net ?? ""), decimalValue(rate ?? "")) || 0;
  const categoryOptions = categories.map((c) => ({ value: c, label: c }));

  async function onSubmit(values: z.output<typeof expenseInput>) {
    const result = await saveExpenseAction(expense?.id ?? null, values);
    if (!toastResult(result, expense ? "Gider güncellendi." : "Gider eklendi.") || !result.id) return;
    if (file) {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch(receiptUrl(result.id), { method: "POST", body });
      if (!response.ok) toast.error(`Fiş eklenemedi: ${(await response.json().catch(() => null))?.error ?? response.status}`);
    }
    onDone();
    router.refresh();
  }

  const text = (name: "spentOn" | "party" | "netAmount" | "kdvRate", label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} {...props} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-full flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("spentOn", "Tarih", { type: "date" })}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <FormControl>
                  <Combobox options={categoryOptions} value={field.value} onChange={field.onChange} disabled={field.disabled} allowNew placeholder="Seçin veya yazın" className="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {text("netAmount", "Tutar (KDV hariç)", { inputMode: "decimal", className: "tabular-nums" })}
          {text("kdvRate", "KDV %", { inputMode: "decimal", className: "tabular-nums" })}
        </div>
        <p className="text-muted-foreground -mt-2 text-sm tabular-nums">
          KDV dahil: <span className="text-foreground font-medium">{tl(total)}</span>
        </p>
        {text("party", "Kime ödendi (isteğe bağlı)", { placeholder: "Mal sahibi, tedarikçi, çalışan…" })}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} placeholder="Ör. Ekim kirası" />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid gap-2">
          <Label htmlFor="gider-fis">Fiş (isteğe bağlı)</Label>
          <Input id="gider-fis" type="file" accept="application/pdf,image/*" disabled={!canEdit} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <p className="text-muted-foreground text-sm">
            PDF ya da fotoğraf, en çok 4 MB.{" "}
            {expense?.fileName && (
              <a href={receiptUrl(expense.id)} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                Kayıtlı fiş: {expense.fileName}
              </a>
            )}
          </p>
        </div>
        {canEdit && (
          <SheetActions>
            <Button type="button" variant="outline" onClick={onDone}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </SheetActions>
        )}
      </form>
    </Form>
  );
}
