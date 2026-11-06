"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { z } from "zod";
import { toast } from "sonner";
import { Button } from "@artek/ui/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@artek/ui/components/form";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Switch } from "@artek/ui/components/switch";
import { Textarea } from "@artek/ui/components/textarea";
import { Combobox } from "@/components/combobox";
import { FormSheet, SheetActions } from "@/components/form-sheet";
import { toastResult } from "@/components/form-status";
import { decimalValue, displayDecimal } from "@/lib/decimal";
import { expenseInput, withKdv } from "@/lib/expense-input";
import { day, tl } from "@/lib/finance-calc";
import { saveExpenseAction, stopRecurrenceAction } from "./actions";
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
      repeatMonthly: false,
      repeatUntil: "",
    },
    disabled: !canEdit,
  });
  const [net, rate, repeatMonthly] = useWatch({ control: form.control, name: ["netAmount", "kdvRate", "repeatMonthly"] });
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

  const text = (name: "spentOn" | "party" | "netAmount" | "kdvRate" | "repeatUntil", label: string, props: React.ComponentProps<typeof Input> = {}) => (
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
        {expense?.recurrenceId ? (
          <RepeatNote expense={expense} canEdit={canEdit} today={today} onStopped={() => router.refresh()} />
        ) : (
          <div className="flex flex-col gap-4 rounded-lg border p-3">
            <FormField
              control={form.control}
              name="repeatMonthly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={field.disabled} />
                  </FormControl>
                  <div className="flex flex-col gap-1">
                    <FormLabel>Her ay tekrarla</FormLabel>
                    <FormDescription>Kira, maaş, SGK gibi her ay aynı olan giderler için. Bu tarihten itibaren her ay aynı gün kendiliğinden eklenir.</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            {repeatMonthly && text("repeatUntil", "Bitiş tarihi (isteğe bağlı)", { type: "date", min: form.getValues("spentOn") })}
          </div>
        )}
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

function RepeatNote({ expense, canEdit, today, onStopped }: { expense: ExpenseRow; canEdit: boolean; today: string; onStopped: () => void }) {
  const [pending, startTransition] = useTransition();
  const [endsOn, setEndsOn] = useState(expense.repeatEndsOn ?? today);
  const ended = expense.repeatEndsOn !== null && expense.repeatEndsOn <= today;
  return (
    <div className="bg-muted/40 flex flex-col gap-3 rounded-lg border p-3 text-sm">
      <span>
        {ended
          ? `Her ay tekrarlanıyordu; ${day(expense.repeatEndsOn!)} tarihinde bitti.`
          : `Her ay tekrarlanan bir giderin bu ayki kaydı${expense.repeatEndsOn ? `; ${day(expense.repeatEndsOn)} tarihinde bitecek` : ""}. Burada değiştirdiğiniz yalnız bu ayı etkiler.`}
      </span>
      {canEdit && !ended && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Son tekrar günü</span>
            <Input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className="w-auto" />
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !endsOn}
            onClick={() =>
              startTransition(async () => {
                if (toastResult(await stopRecurrenceAction(expense.recurrenceId!, endsOn), "Tekrarın bitişi kaydedildi.")) onStopped();
              })
            }
          >
            Tekrarı bitir
          </Button>
        </div>
      )}
    </div>
  );
}
