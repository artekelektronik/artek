"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { CheckCircle2, FileText, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@artek/ui/components/alert";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@artek/ui/components/empty";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@artek/ui/components/form";
import { Input } from "@artek/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@artek/ui/components/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@artek/ui/components/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@artek/ui/components/tabs";
import { Combobox } from "@/components/combobox";
import { toastResult } from "@/components/form-status";
import { day, kdvRateLabel, tl } from "@/lib/finance-calc";
import { QuickAddProduct } from "@/components/quick-add-product";
import { newCustomer, writtenCodes } from "@/lib/invoice-match";
import { compact } from "@/lib/product-search";
import type { InvoiceReview } from "@/lib/invoices";
import { invoiceKind } from "@/lib/labels";
import { unitLabels } from "@/lib/quantity";
import { confirmInvoiceAction } from "./actions";
import { DeleteInvoiceDialog } from "./invoice-delete";
import { InvoiceStatusBadge } from "./invoice-status";
import { pdfUrl } from "./invoice-table";
import { Materials, ModeField } from "./line-fields";
import { amount, componentsSchema, decimal, lineNet, modeFor, modeSchema, needsMaterials, notInCatalogue, productOption, scaledRecipe, suggestedFirst, toNumber, type Mode } from "./options";
import { useFatura } from "./use-fatura";

const formSchema = z
  .object({
    customerId: z.string().min(1, { error: "Müşteriyi seçin." }),
    lokasyonId: z.string(),
    materialsLokasyonId: z.string(),
    lines: z.array(
      z
        .object({
          productId: z.string().min(1, { error: "Ürünü seçin ya da “Katalogda yok” deyin." }),
          mode: modeSchema,
          quantity: amount("Miktar?"),
          unitPrice: amount("Fiyat?"),
          stockQuantity: z.string(),
          components: componentsSchema,
        })
        .refine((l) => l.mode !== "stok" || toNumber(l.stockQuantity) > 0, { path: ["stockQuantity"], error: "Miktarı girin." })
        .refine(...needsMaterials),
    ),
  })
  .refine((v) => v.lokasyonId || !v.lines.some((l) => l.mode === "stok"), { path: ["lokasyonId"], error: "Lokasyonu seçin." })
  .refine((v) => v.materialsLokasyonId || !v.lines.some((l) => l.mode === "uretim"), { path: ["materialsLokasyonId"], error: "Lokasyonu seçin." });
type FormValues = z.infer<typeof formSchema>;

// Sold before the Lokasyon's Açılış sayımı: the count already took it out of stock.
const soldBeforeOpening = (review: InvoiceReview, lokasyonId: string) => {
  const openedOn = review.lokasyon.find((l) => l.id === lokasyonId)?.openedOn;
  return Boolean(openedOn && review.issuedOn < openedOn);
};
const lokasyonLike = (review: InvoiceReview, pattern: RegExp) => (review.lokasyon.find((l) => pattern.test(l.name)) ?? review.lokasyon[0])?.id ?? "";
const recipeFor = (review: InvoiceReview, productId: string, quantity: string) => scaledRecipe(review.recipes[productId], quantity);

// A stocked line sold before the Lokasyon's Açılış sayımı starts as untouched.
function defaultMode(review: InvoiceReview, line: InvoiceReview["lines"][number], productId: string, lokasyonId: string): Mode {
  const mode = modeFor(productId, { recipes: review.recipes, builtToOrder: line.builtToOrder, isReturn: review.isReturn });
  return mode === "stok" && soldBeforeOpening(review, lokasyonId) ? "yok" : mode;
}

// What was chosen before (on confirm, or on a manual draft) wins over the defaults.
function savedMode(line: InvoiceReview["lines"][number], confirmed: boolean): Mode | null {
  if (line.components) return "uretim";
  if (line.stockQuantity) return "stok";
  return confirmed ? "yok" : null;
}

export function InvoiceSheet({ review, canEdit }: { review: InvoiceReview | null; canEdit: boolean }) {
  const [, setFatura] = useFatura();
  const close = () => setFatura(null, { history: "replace" });
  return (
    <Sheet open={Boolean(review)} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full gap-0 sm:w-1/2 sm:max-w-none">
        {review && <InvoiceReviewBody key={review.id} review={review} canEdit={canEdit} onDone={close} />}
      </SheetContent>
    </Sheet>
  );
}

function InvoiceReviewBody({ review, canEdit, onDone }: { review: InvoiceReview; canEdit: boolean; onDone: () => void }) {
  const confirmed = review.status === "onaylandi";
  const editable = canEdit && !confirmed && !review.archivedAt && !review.manual;
  const [deleting, setDeleting] = useState(false);
  const lokasyonId = review.lokasyonId ?? lokasyonLike(review, /mağaza/i);

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      customerId: review.customerMatch.customerId ?? "",
      lokasyonId,
      materialsLokasyonId: review.materialsLokasyonId ?? lokasyonLike(review, /imalat/i),
      lines: review.lines.map((l) => {
        const productId = l.productId ?? (confirmed ? notInCatalogue : "");
        return {
          productId,
          mode: savedMode(l, confirmed) ?? defaultMode(review, l, productId, lokasyonId),
          quantity: decimal(l.quantity),
          unitPrice: decimal(l.unitPrice),
          stockQuantity: decimal(l.stockQuantity ?? l.quantity),
          components: l.components?.map((c) => ({ ...c, quantity: decimal(c.quantity) })) ?? (productId ? recipeFor(review, productId, l.quantity) : []),
        };
      }),
    },
    disabled: !editable,
  });

  async function onSubmit(values: FormValues) {
    const result = await confirmInvoiceAction({
      id: review.id,
      customerId: values.customerId,
      lokasyonId: values.lokasyonId || null,
      materialsLokasyonId: values.materialsLokasyonId || null,
      lines: values.lines.map((l, i) => {
        const productId = l.productId === notInCatalogue ? null : l.productId;
        return {
          seq: review.lines[i].seq,
          productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          stockQuantity: productId && l.mode === "stok" ? l.stockQuantity : null,
          components: l.mode === "uretim" ? l.components : [],
        };
      }),
    });
    if (toastResult(result, `Fatura ${review.number} onaylandı.`)) onDone();
  }

  const productOptions = useMemo(() => review.products.map(productOption), [review.products]);
  const customerOptions = [
    ...(review.customerMatch.customerId ? [] : [{ value: newCustomer, label: `Yeni müşteri ekle: ${review.buyer.name} · ${review.buyer.taxId}` }]),
    ...suggestedFirst(review.customers, review.customerMatch.suggestions, (c) => ({ value: c.id, label: `${c.name} · ${c.taxId}` })),
  ];

  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <SheetTitle className="tabular-nums">Fatura {review.number}</SheetTitle>
          {review.archivedAt ? <Badge variant="outline">Arşivde</Badge> : <InvoiceStatusBadge status={review.status} />}
          <Badge variant="outline">{invoiceKind(review)}</Badge>
          {review.manual && <Badge variant="outline">Elle girildi</Badge>}
        </div>
        <SheetDescription className="tabular-nums">
          {day(review.issuedOn)} · {tl(Number(review.netAmount))} KDV hariç · KDV {tl(Number(review.totalAmount) - Number(review.netAmount))} ({kdvRateLabel(Number(review.netAmount), Number(review.totalAmount))}) ·{" "}
          {tl(Number(review.totalAmount))} KDV dahil
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <Tabs defaultValue="fatura" className="min-h-0 flex-1 gap-0">
            <TabsList className="mx-4 mt-3">
              <TabsTrigger value="fatura">Fatura</TabsTrigger>
              <TabsTrigger value="pdf">Orijinal PDF</TabsTrigger>
            </TabsList>

            <TabsContent value="fatura" className="flex flex-col gap-5 overflow-y-auto px-4 py-4">
              {review.manual && (
                <Alert>
                  <FileText />
                  <AlertDescription>
                    Elle girilen fatura. Aynı numaralı ({review.number}) PDF yüklenince bilgiler PDF’ten gelir, seçtiğiniz ürünler kalır ve onaylanabilir.
                  </AlertDescription>
                </Alert>
              )}
              {confirmed && (
                <Alert>
                  <CheckCircle2 />
                  <AlertDescription>
                    <span>
                      {review.confirmedAtText} tarihinde {review.confirmedBy ?? "bir kullanıcı"} onayladı.{" "}
                      {review.stockDocumentId ? (
                        <>
                          Stok hareketleri{" "}
                          <Link href="/hareketler" className="underline underline-offset-4">
                            Hareketler
                          </Link>
                          ’de görünür.
                        </>
                      ) : (
                        "Stok değişmedi."
                      )}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <section className="grid gap-x-6 gap-y-1 rounded-lg border p-3 text-sm sm:grid-cols-2">
                <p className="text-muted-foreground col-span-full text-xs font-medium">Faturadaki alıcı</p>
                <p className="font-medium">{review.buyer.name}</p>
                <p className="text-muted-foreground tabular-nums sm:text-right">
                  {review.buyer.taxIdType} {review.buyer.taxId}
                </p>
                <p className="text-muted-foreground">{[review.buyer.district, review.buyer.city].filter(Boolean).join(" / ") || "—"}</p>
                {!review.manual && (
                  <p className="text-muted-foreground truncate font-mono text-xs sm:text-right" title="ETTN">
                    {review.ettn}
                  </p>
                )}
              </section>

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Müşteri</FormLabel>
                    <FormControl>
                      <Combobox options={customerOptions} value={field.value} onChange={field.onChange} disabled={field.disabled} placeholder="Müşteri ara" className="w-full" />
                    </FormControl>
                    {review.customerMatch.customerId ? (
                      <FormDescription>Faturadaki {review.buyer.taxIdType} ile kayıtlı müşteri.</FormDescription>
                    ) : (
                      editable && (
                        <FormDescription className="text-amber-700 dark:text-amber-300">
                          Bu {review.buyer.taxIdType} ile kayıtlı müşteri yok.{" "}
                          {review.customerMatch.suggestions.length > 0
                            ? "Adı benzeyen firmalar listenin başında; hiçbiri değilse yeni müşteri olarak ekleyin."
                            : "Listeden seçin ya da yeni müşteri olarak ekleyin."}
                        </FormDescription>
                      )
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <LokasyonFields review={review} />

              <section className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-sm font-medium">Satırlar</h3>
                  <NetTotal />
                </div>
                {review.lines.length === 0 && <p className="text-muted-foreground text-sm">Faturada okunabilen satır yok.</p>}
                {review.lines.map((line, i) => (
                  <LineFields key={line.seq} index={i} review={review} productOptions={productOptions} />
                ))}
              </section>
            </TabsContent>

            <TabsContent value="pdf" className="flex min-h-0 flex-col gap-2 px-4 py-4">
              {review.hasFile ? (
                <>
                  <iframe src={pdfUrl(review.id)} title={`Fatura ${review.number}`} className="min-h-[70vh] w-full flex-1 rounded-md border" />
                  <a href={pdfUrl(review.id)} target="_blank" rel="noreferrer" className="text-muted-foreground text-xs underline-offset-4 hover:underline">
                    {review.fileName} · yeni sekmede aç
                  </a>
                </>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileText />
                    </EmptyMedia>
                    <EmptyTitle>PDF yok</EmptyTitle>
                    <EmptyDescription>
                      {review.manual
                        ? "Fatura elle girildi; PDF’i yüklenince burada görünür."
                        : `Bu fatura, PDF’ler saklanmaya başlamadan önce yüklendi. Aynı PDF’i (${review.fileName}) tekrar yüklerseniz buraya eklenir.`}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </TabsContent>
          </Tabs>

          {canEdit && (
            <SheetFooter className="flex-row justify-between border-t">
              <Button type="button" variant="ghost" className="text-destructive" onClick={() => setDeleting(true)}>
                Sil
              </Button>
              {editable && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onDone}>
                    Sonra
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Onaylanıyor…" : "Onayla"}
                  </Button>
                </div>
              )}
            </SheetFooter>
          )}
        </form>
      </Form>
      <DeleteInvoiceDialog invoice={review} open={deleting} onOpenChange={setDeleting} onDeleted={onDone} />
    </>
  );
}

function NetTotal() {
  const { control } = useFormContext<FormValues>();
  const lines = useWatch({ control, name: "lines" });
  return <p className="text-muted-foreground text-xs tabular-nums">KDV hariç {tl(lineNet(lines))}</p>;
}

function LokasyonFields({ review }: { review: InvoiceReview }) {
  const { control } = useFormContext<FormValues>();
  const [lokasyonId, lines] = useWatch({ control, name: ["lokasyonId", "lines"] });
  const chosen = review.lokasyon.find((l) => l.id === lokasyonId);
  const select = (name: "lokasyonId" | "materialsLokasyonId", label: string, children?: React.ReactNode) => (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange} disabled={field.disabled}>
            <FormControl>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Lokasyon seçin" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {review.lokasyon.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!field.disabled && children}
          <FormMessage />
        </FormItem>
      )}
    />
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {select(
        "lokasyonId",
        review.isReturn ? "Ürünlerin geri gireceği Lokasyon" : "Ürünlerin çıktığı Lokasyon",
        chosen?.openedOn && review.issuedOn < chosen.openedOn && (
          <Alert className="mt-1">
            <TriangleAlert />
            <AlertDescription>
              Bu fatura {chosen.name} açılış sayımından ({day(chosen.openedOn)}) önce kesilmiş; o satış sayımda zaten düşülmüş olabilir.
            </AlertDescription>
          </Alert>
        ),
      )}
      {lines.some((l) => l.mode === "uretim") && select("materialsLokasyonId", "Malzemelerin çıktığı Lokasyon")}
    </div>
  );
}

function LineFields({ index, review, productOptions }: { index: number; review: InvoiceReview; productOptions: ReturnType<typeof productOption>[] }) {
  const line = review.lines[index];
  const { control, setValue, getValues } = useFormContext<FormValues>();
  const [productId, mode, quantity, unitPrice, lokasyonId] = useWatch({
    control,
    name: [`lines.${index}.productId`, `lines.${index}.mode`, `lines.${index}.quantity`, `lines.${index}.unitPrice`, "lokasyonId"],
  });
  const product = review.products.find((p) => p.id === productId);
  const options = useMemo(
    () => [{ value: notInCatalogue, label: "Katalogda yok (stoğa dokunma)" }, ...suggestedFirst(review.products, line.suggestions, productOption)],
    [line.suggestions, review.products],
  );
  const lineAmount = lineNet([{ quantity, unitPrice }]);
  const router = useRouter();
  // A code written on the line that the catalogue doesn't have yet, e.g. a new Özel trafo.
  const missingCode = writtenCodes(line.description).find((code) => !review.products.some((p) => compact(p.code) === compact(code)));

  function pickProduct(value: string) {
    setValue(`lines.${index}.productId`, value, { shouldValidate: true });
    setValue(`lines.${index}.mode`, defaultMode(review, line, value, lokasyonId));
    if (review.recipes[value]) setValue(`lines.${index}.components`, recipeFor(review, value, getValues(`lines.${index}.quantity`)));
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 text-sm">
        <p className="pt-2 font-medium">
          <span className="text-muted-foreground mr-2 tabular-nums">{line.seq}.</span>
          {line.description}
        </p>
        <div className="flex items-start gap-1.5 tabular-nums">
          <AmountField name={`lines.${index}.quantity`} label="Miktar" />
          <span className="text-muted-foreground pt-2">{line.unit} ×</span>
          <AmountField name={`lines.${index}.unitPrice`} label="Birim fiyat" />
          <span className="text-muted-foreground pt-2">
            TL = <span className="text-foreground">{tl(lineAmount)}</span>
          </span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_11rem_8rem] sm:items-start">
        <FormField
          control={control}
          name={`lines.${index}.productId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">{line.seq}. satırın ürünü</FormLabel>
              <FormControl>
                <Combobox options={options} value={field.value} onChange={pickProduct} disabled={field.disabled} placeholder="Ürün ara" className="w-full" />
              </FormControl>
              {!field.disabled && !field.value && line.suggestions.length > 0 && <FormDescription>Benzeyen ürünler listenin başında.</FormDescription>}
              {!field.disabled && field.value && field.value === line.productId && <FormDescription>Otomatik eşleşti; kontrol edin.</FormDescription>}
              {!field.disabled && !field.value && missingCode && (
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                  {missingCode} katalogda yok.
                  <QuickAddProduct
                    categories={[...new Set(review.products.map((p) => p.category))]}
                    defaults={{
                      code: missingCode,
                      name: line.description.replace(/\(?\s*ART[\s-]*[^)\s]*\)?/iu, "").trim(),
                      category: line.builtToOrder ? "Özel trafo" : undefined,
                      unit: "adet",
                      isMaterial: false,
                      isTradeGoods: true,
                    }}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        Ürün olarak ekle
                      </Button>
                    }
                    onAdded={(p) => {
                      pickProduct(p.id);
                      router.refresh();
                    }}
                  />
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <ModeField index={index} isReturn={review.isReturn} disabled={!productId || productId === notInCatalogue} />
        {mode === "stok" && (
          <FormField
            control={control}
            name={`lines.${index}.stockQuantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Stok miktarı</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input {...field} inputMode="decimal" className="tabular-nums" />
                  </FormControl>
                  <span className="text-muted-foreground text-xs">{product ? unitLabels[product.unit] : line.unit}</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
      {mode === "uretim" && <Materials index={index} options={productOptions} />}
    </div>
  );
}

function AmountField({ name, label }: { name: `lines.${number}.quantity` | `lines.${number}.unitPrice`; label: string }) {
  const { control } = useFormContext<FormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="sr-only">{label}</FormLabel>
          <FormControl>
            <Input {...field} inputMode="decimal" className="h-8 w-24 text-right tabular-nums" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
