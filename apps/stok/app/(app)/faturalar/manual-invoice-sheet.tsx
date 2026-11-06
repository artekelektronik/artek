"use client";

import { useMemo } from "react";
import { useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@artek/ui/components/form";
import { Input } from "@artek/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@artek/ui/components/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@artek/ui/components/sheet";
import { Combobox } from "@/components/combobox";
import { toastResult } from "@/components/form-status";
import { tl } from "@/lib/finance-calc";
import { newCustomer } from "@/lib/invoice-match";
import type { manualInvoiceOptions } from "@/lib/invoices";
import { unitLabels } from "@/lib/quantity";
import { createManualInvoiceAction } from "./actions";
import { Materials } from "./materials";
import { notInCatalogue, productOption, scaledRecipe, toNumber } from "./options";
import { useFatura, useManualInvoice } from "./use-fatura";

type Options = Awaited<ReturnType<typeof manualInvoiceOptions>>;
const positive = (v: string) => toNumber(v) > 0;

const formSchema = z
  .object({
    number: z.string().trim().min(3, { error: "Fatura numarasını yazın." }),
    issuedOn: z.iso.date({ error: "Tarihi seçin." }),
    type: z.enum(["SATIS", "IADE"]),
    scenario: z.enum(["TEMELFATURA", "EARSIVFATURA"]),
    kdvRate: z.string().refine((v) => toNumber(v) >= 0, { error: "KDV oranı?" }),
    customerId: z.string().min(1, { error: "Müşteriyi seçin." }),
    buyerName: z.string().trim(),
    buyerTaxId: z.string().trim(),
    lines: z
      .array(
        z
          .object({
            description: z.string().trim().min(1, { error: "Açıklama yazın." }),
            quantity: z.string().refine(positive, { error: "Miktar?" }),
            unit: z.string().trim().min(1, { error: "Birim?" }),
            unitPrice: z.string().refine(positive, { error: "Fiyat?" }),
            productId: z.string(),
            mode: z.enum(["stok", "uretim", "yok"]),
            components: z.array(z.object({ productId: z.string().min(1, { error: "Malzemeyi seçin." }), quantity: z.string().refine(positive, { error: "Miktar?" }) })),
          })
          .refine((l) => l.mode !== "uretim" || l.components.length > 0, { path: ["components"], error: "En az bir malzeme ekleyin." }),
      )
      .min(1, { error: "En az bir satır girin." }),
  })
  .refine((v) => v.customerId !== newCustomer || v.buyerName, { path: ["buyerName"], error: "Firma adını yazın." })
  .refine((v) => v.customerId !== newCustomer || /^\d{10,11}$/.test(v.buyerTaxId), { path: ["buyerTaxId"], error: "10 haneli VKN ya da 11 haneli TCKN." });
type FormValues = z.infer<typeof formSchema>;

// The product is optional: a line can be a stocked Ürün, an Özel trafo built from materials, or free text.
const emptyLine = { description: "", quantity: "1", unit: "Adet", unitPrice: "", productId: notInCatalogue, mode: "yok" as const, components: [] };

// An invoice typed by hand before its PDF exists; it waits as a draft until the PDF with the same number is uploaded.
export function ManualInvoiceSheet({ options }: { options: Options | null }) {
  const [, setManual] = useManualInvoice();
  return (
    <Sheet open={Boolean(options)} onOpenChange={(open) => !open && setManual(null, { history: "replace" })}>
      <SheetContent className="w-full gap-0 sm:w-1/2 sm:max-w-none">
        <SheetHeader className="border-b">
          <SheetTitle>Elle fatura</SheetTitle>
          <SheetDescription>PDF’i gelene kadar onay bekler; aynı numaralı PDF yüklenince ona bağlanır.</SheetDescription>
        </SheetHeader>
        {options && <ManualInvoiceForm options={options} />}
      </SheetContent>
    </Sheet>
  );
}

function ManualInvoiceForm({ options }: { options: Options }) {
  const [, setManual] = useManualInvoice();
  const [, setFatura] = useFatura();
  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      number: "",
      issuedOn: new Date().toISOString().slice(0, 10),
      type: "SATIS",
      scenario: "TEMELFATURA",
      kdvRate: "20",
      customerId: "",
      buyerName: "",
      buyerTaxId: "",
      lines: [emptyLine],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const [customerId, lines, kdvRate] = useWatch({ control: form.control, name: ["customerId", "lines", "kdvRate"] });
  const net = lines.reduce((s, l) => s + toNumber(l.quantity) * toNumber(l.unitPrice), 0) || 0;
  const customerOptions = useMemo(
    () => [{ value: newCustomer, label: "Yeni müşteri…" }, ...options.customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.taxId}` }))],
    [options.customers],
  );

  async function onSubmit(v: FormValues) {
    const result = await createManualInvoiceAction({
      number: v.number,
      issuedOn: v.issuedOn,
      type: v.type,
      scenario: v.scenario,
      kdvRate: toNumber(v.kdvRate),
      customerId: v.customerId === newCustomer ? null : v.customerId,
      buyer: { name: v.buyerName, taxId: v.buyerTaxId },
      lines: v.lines.map(({ mode, components, ...l }) => ({
        ...l,
        productId: l.productId === notInCatalogue ? null : l.productId,
        fromStock: mode === "stok",
        components: mode === "uretim" ? components : [],
      })),
    });
    if (toastResult(result, `${v.number} elle eklendi; PDF’i bekliyor.`) && result.id) {
      await setManual(null);
      await setFatura(result.id);
    }
  }

  const text = (name: "number" | "issuedOn" | "kdvRate" | "buyerName" | "buyerTaxId", label: string, props: React.ComponentProps<typeof Input> = {}) => (
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
  const choice = (name: "type" | "scenario", label: string, items: [string, string][]) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {items.map(([value, text]) => (
                <SelectItem key={value} value={value}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-5 overflow-y-auto px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {text("number", "Fatura no", { placeholder: "AAA2026000000330", className: "tabular-nums" })}
            {text("issuedOn", "Tarih", { type: "date" })}
            {text("kdvRate", "KDV %", { inputMode: "decimal" })}
            {choice("type", "Tür", [
              ["SATIS", "Satış"],
              ["IADE", "İade"],
            ])}
            {choice("scenario", "Senaryo", [
              ["TEMELFATURA", "e-Fatura"],
              ["EARSIVFATURA", "e-Arşiv"],
            ])}
          </div>

          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Müşteri</FormLabel>
                <FormControl>
                  <Combobox options={customerOptions} value={field.value} onChange={field.onChange} placeholder="Müşteri ara" className="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {customerId === newCustomer && (
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              {text("buyerName", "Firma adı")}
              {text("buyerTaxId", "VKN / TCKN", { inputMode: "numeric" })}
            </div>
          )}

          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-medium">Satırlar</h3>
              <p className="text-muted-foreground text-xs tabular-nums">
                KDV hariç {tl(net)} · KDV dahil {tl(net * (1 + toNumber(kdvRate) / 100) || 0)}
              </p>
            </div>
            {fields.map((f, i) => (
              <ManualLine key={f.id} index={i} options={options} onRemove={fields.length > 1 ? () => remove(i) : undefined} />
            ))}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => append(emptyLine)}>
              <Plus /> Satır ekle
            </Button>
          </section>
        </div>
        <SheetFooter className="flex-row justify-end border-t">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

export function ManualInvoiceButton() {
  const [, setManual] = useManualInvoice();
  return (
    <Button type="button" variant="outline" onClick={() => setManual(true)}>
      <Plus /> Elle fatura
    </Button>
  );
}

function ManualLine({ index, options, onRemove }: { index: number; options: Options; onRemove?: () => void }) {
  const { control, setValue, getValues } = useFormContext<FormValues>();
  const [mode, productId, type] = useWatch({ control, name: [`lines.${index}.mode`, `lines.${index}.productId`, "type"] });
  const productOptions = useMemo(() => [{ value: notInCatalogue, label: "Katalogda yok (serbest satır)" }, ...options.products.map(productOption)], [options.products]);
  const isProduct = Boolean(productId) && productId !== notInCatalogue;

  // Picking an Ürün fills the description and unit, and starts it as stocked, or built from its reçete.
  function pickProduct(value: string) {
    setValue(`lines.${index}.productId`, value);
    const p = options.products.find((x) => x.id === value);
    if (!p) return setValue(`lines.${index}.mode`, "yok");
    if (!getValues(`lines.${index}.description`)) setValue(`lines.${index}.description`, `${p.name} (${p.code})`, { shouldValidate: true });
    setValue(`lines.${index}.unit`, unitLabels[p.unit]);
    const built = type !== "IADE" && (options.recipes[p.id] || p.category === "Özel trafo");
    setValue(`lines.${index}.mode`, built ? "uretim" : "stok");
    setValue(`lines.${index}.components`, built ? scaledRecipe(options.recipes[p.id], getValues(`lines.${index}.quantity`)) : []);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="grid grid-cols-[1fr_11rem_auto] items-start gap-2">
        <FormField
          control={control}
          name={`lines.${index}.productId`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Combobox options={productOptions} value={field.value} onChange={pickProduct} placeholder="Ürün ara (isteğe bağlı)" className="w-full" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`lines.${index}.mode`}
          render={({ field }) => (
            <FormItem>
              <Select value={field.value} onValueChange={field.onChange} disabled={!isProduct}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="stok">{type === "IADE" ? "Stoğa geri al" : "Stoktan düş"}</SelectItem>
                  {type !== "IADE" && <SelectItem value="uretim">Malzemeden üret</SelectItem>}
                  <SelectItem value="yok">Stoğa dokunma</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <Button type="button" variant="ghost" size="icon" aria-label="Satırı sil" disabled={!onRemove} onClick={onRemove}>
          <X />
        </Button>
      </div>
      <FormField
        control={control}
        name={`lines.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Açıklama, ör. FERRİT NÜVE (ART-0092)" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-3 items-start gap-2 sm:w-96">
        {(["quantity", "unit", "unitPrice"] as const).map((key) => (
          <FormField
            key={key}
            control={control}
            name={`lines.${index}.${key}`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder={{ quantity: "Miktar", unit: "Birim", unitPrice: "Birim fiyat" }[key]} className="tabular-nums" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
      {mode === "uretim" && <Materials index={index} products={options.products} />}
    </div>
  );
}
