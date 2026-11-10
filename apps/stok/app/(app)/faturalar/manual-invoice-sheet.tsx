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
import { Switch } from "@artek/ui/components/switch";
import { Combobox } from "@/components/combobox";
import { FormSheet, SheetActions } from "@/components/form-sheet";
import { toastResult } from "@/components/form-status";
import { tl } from "@/lib/finance-calc";
import { newCustomer } from "@/lib/invoice-match";
import type { manualInvoiceOptions } from "@/lib/invoices";
import { unitLabels } from "@/lib/quantity";
import { createManualInvoiceAction } from "./actions";
import { Materials, ModeField } from "./line-fields";
import { amount, componentsSchema, lineNet, modeFor, modeSchema, needsMaterials, notInCatalogue, productOption, scaledRecipe } from "./options";
import { useFatura, useManualInvoice } from "./use-fatura";

type Options = Awaited<ReturnType<typeof manualInvoiceOptions>>;
type ProductOptions = ReturnType<typeof productOption>[];

const formSchema = z
  .object({
    number: z.string().trim().min(3, { error: "Fatura numarasını yazın." }),
    issuedOn: z.iso.date({ error: "Tarihi seçin." }),
    type: z.enum(["SATIS", "IADE"]),
    scenario: z.enum(["TEMELFATURA", "EARSIVFATURA"]),
    kdvRate: z.enum(["20", "10", "1", "0"]),
    pricesIncludeKdv: z.boolean(),
    customerId: z.string().min(1, { error: "Müşteriyi seçin." }),
    buyerName: z.string().trim(),
    buyerTaxId: z.string().trim(),
    lines: z
      .array(
        z
          .object({
            description: z.string().trim().min(1, { error: "Açıklama yazın." }),
            quantity: amount("Miktar?"),
            unit: z.string().trim().min(1, { error: "Birim?" }),
            unitPrice: amount("Fiyat?"),
            productId: z.string(),
            mode: modeSchema,
            components: componentsSchema,
          })
          .refine(...needsMaterials),
      )
      .min(1, { error: "En az bir satır girin." }),
  })
  .refine((v) => v.customerId !== newCustomer || v.buyerName, { path: ["buyerName"], error: "Firma adını yazın." })
  .refine((v) => v.customerId !== newCustomer || /^\d{10,11}$/.test(v.buyerTaxId), { path: ["buyerTaxId"], error: "10 haneli VKN ya da 11 haneli TCKN." });
type FormValues = z.infer<typeof formSchema>;

const emptyLine = { description: "", quantity: "1", unit: "Adet", unitPrice: "", productId: notInCatalogue, mode: "yok" as const, components: [] };

// Typed by hand before its PDF exists; waits as a draft until the PDF with the same number is uploaded.
export function ManualInvoiceSheet({ options }: { options: Options | null }) {
  const [, setManual] = useManualInvoice();
  return (
    <FormSheet
      open={Boolean(options)}
      onOpenChange={(open) => !open && setManual(null, { history: "replace" })}
      title="Elle fatura"
      description="PDF’i gelene kadar onay bekler; aynı numaralı PDF yüklenince ona bağlanır."
    >
      {options && <ManualInvoiceForm options={options} />}
    </FormSheet>
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
      pricesIncludeKdv: false,
      customerId: "",
      buyerName: "",
      buyerTaxId: "",
      lines: [emptyLine],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const customerId = useWatch({ control: form.control, name: "customerId" });
  const customerOptions = useMemo(
    () => [{ value: newCustomer, label: "Yeni müşteri…" }, ...options.customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.taxId}` }))],
    [options.customers],
  );
  const productOptions = useMemo(() => options.products.map(productOption), [options.products]);

  async function onSubmit(v: FormValues) {
    const result = await createManualInvoiceAction({
      number: v.number,
      issuedOn: v.issuedOn,
      type: v.type,
      scenario: v.scenario,
      kdvRate: Number(v.kdvRate),
      pricesIncludeKdv: v.pricesIncludeKdv,
      customerId: v.customerId === newCustomer ? null : v.customerId,
      buyer: { name: v.buyerName, taxId: v.buyerTaxId },
      lines: v.lines.map(({ mode, components, ...l }) => ({
        ...l,
        productId: l.productId === notInCatalogue ? null : l.productId,
        stockQuantity: mode === "stok" ? l.quantity : null,
        components: mode === "uretim" ? components : [],
      })),
    });
    if (toastResult(result, `${v.number} elle eklendi; PDF’i bekliyor.`) && result.id) {
      await setManual(null);
      await setFatura(result.id);
    }
  }

  const text = (name: "number" | "issuedOn" | "buyerName" | "buyerTaxId", label: string, props: React.ComponentProps<typeof Input> = {}) => (
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
  const choice = (name: "type" | "scenario" | "kdvRate", label: string, items: [string, string][]) => (
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-full flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {text("number", "Fatura no", { placeholder: "AAA2026000000330", className: "tabular-nums" })}
          {text("issuedOn", "Tarih", { type: "date" })}
          {choice("kdvRate", "KDV", [
            ["20", "%20"],
            ["10", "%10"],
            ["1", "%1"],
            ["0", "%0 · istisna / ihracat"],
          ])}
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

        <FormField
          control={form.control}
          name="pricesIncludeKdv"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Fiyatlar KDV dahil yazıldı</FormLabel>
            </FormItem>
          )}
        />

        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium">Satırlar</h3>
            <Totals />
          </div>
          {fields.map((f, i) => (
            <ManualLine key={f.id} index={i} options={options} productOptions={productOptions} onRemove={fields.length > 1 ? () => remove(i) : undefined} />
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => append(emptyLine)}>
            <Plus /> Satır ekle
          </Button>
        </section>

        <SheetActions>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </SheetActions>
      </form>
    </Form>
  );
}

function Totals() {
  const [lines, kdvRate, included] = useWatch<FormValues, ["lines", "kdvRate", "pricesIncludeKdv"]>({ name: ["lines", "kdvRate", "pricesIncludeKdv"] });
  const kdv = 1 + Number(kdvRate) / 100;
  const typed = lineNet(lines);
  const net = included ? typed / kdv : typed;
  const total = included ? typed : typed * kdv;
  return (
    <p className="text-muted-foreground text-xs tabular-nums">
      KDV hariç {tl(net)} · KDV {tl(total - net)} · KDV dahil {tl(total)}
    </p>
  );
}

function ManualLine({ index, options, productOptions, onRemove }: { index: number; options: Options; productOptions: ProductOptions; onRemove?: () => void }) {
  const { control, setValue, getValues } = useFormContext<FormValues>();
  const [mode, productId, type] = useWatch({ control, name: [`lines.${index}.mode`, `lines.${index}.productId`, "type"] });
  const lineOptions = useMemo(() => [{ value: notInCatalogue, label: "Katalogda yok (serbest satır)" }, ...productOptions], [productOptions]);

  function pickProduct(value: string) {
    setValue(`lines.${index}.productId`, value);
    const p = options.products.find((x) => x.id === value);
    const next = modeFor(value, { recipes: options.recipes, builtToOrder: p?.category === "Özel trafo", isReturn: type === "IADE" });
    setValue(`lines.${index}.mode`, next);
    setValue(`lines.${index}.components`, next === "uretim" ? scaledRecipe(options.recipes[value], getValues(`lines.${index}.quantity`)) : []);
    if (!p) return;
    if (!getValues(`lines.${index}.description`)) setValue(`lines.${index}.description`, `${p.name} (${p.code})`, { shouldValidate: true });
    setValue(`lines.${index}.unit`, unitLabels[p.unit]);
  }

  const input = (name: "description" | "quantity" | "unit" | "unitPrice", label: string, className?: string) => (
    <FormField
      control={control}
      name={`lines.${index}.${name}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="sr-only">{label}</FormLabel>
          <FormControl>
            <Input {...field} placeholder={label} className={className} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="grid grid-cols-[1fr_11rem_auto] items-start gap-2">
        <FormField
          control={control}
          name={`lines.${index}.productId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Ürün</FormLabel>
              <FormControl>
                <Combobox options={lineOptions} value={field.value} onChange={pickProduct} placeholder="Ürün ara (isteğe bağlı)" className="w-full" />
              </FormControl>
            </FormItem>
          )}
        />
        <ModeField index={index} isReturn={type === "IADE"} disabled={!productId || productId === notInCatalogue} />
        <Button type="button" variant="ghost" size="icon" aria-label="Satırı sil" disabled={!onRemove} onClick={onRemove}>
          <X />
        </Button>
      </div>
      {input("description", "Açıklama, ör. FERRİT NÜVE (ART-0092)")}
      <div className="grid grid-cols-3 items-start gap-2 sm:w-96">
        {input("quantity", "Miktar", "tabular-nums")}
        {input("unit", "Birim")}
        {input("unitPrice", "Birim fiyat", "tabular-nums")}
      </div>
      {mode === "uretim" && <Materials index={index} options={productOptions} />}
    </div>
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
