"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { CheckCircle2, FileText, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@artek/ui/components/alert";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@artek/ui/components/empty";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@artek/ui/components/form";
import { Input } from "@artek/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@artek/ui/components/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@artek/ui/components/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@artek/ui/components/tabs";
import { Combobox } from "@/components/combobox";
import { toastResult } from "@/components/form-status";
import { day, tl } from "@/lib/finance-calc";
import { newCustomer } from "@/lib/invoice-match";
import type { InvoiceReview } from "@/lib/invoices";
import { displayQuantity, invoiceKind } from "@/lib/labels";
import { formatQuantity, unitLabels } from "@/lib/quantity";
import { confirmInvoiceAction } from "./actions";
import { pdfUrl } from "./invoice-table";
import { InvoiceStatusBadge } from "./invoice-status";
import { useFatura } from "./use-fatura";

const notInCatalogue = "yok"; // a line's product choice when it isn't an Ürün (labour, freight, Özel trafo)

const formSchema = z
  .object({
    customerId: z.string().min(1, { error: "Müşteriyi seçin." }),
    lokasyonId: z.string(),
    lines: z.array(
      z
        .object({
          productId: z.string().min(1, { error: "Ürünü seçin ya da “Katalogda yok” deyin." }),
          fromStock: z.boolean(),
          quantity: z.string(),
        })
        .refine((l) => !l.fromStock || Number(l.quantity.replace(",", ".")) > 0, { path: ["quantity"], error: "Miktarı girin." }),
    ),
  })
  .refine((v) => v.lokasyonId || !v.lines.some((l) => l.fromStock), { path: ["lokasyonId"], error: "Lokasyonu seçin." });
type FormValues = z.infer<typeof formSchema>;

const decimal = (value: string) => displayQuantity(formatQuantity(value));
// Sold before the Lokasyon's Açılış sayımı: the count already took it out of stock.
const soldBeforeOpening = (review: InvoiceReview, lokasyonId: string) => {
  const openedOn = review.lokasyon.find((l) => l.id === lokasyonId)?.openedOn;
  return Boolean(openedOn && review.issuedOn < openedOn);
};
const suggestedFirst = <T extends { id: string }>(items: T[], suggestions: string[], toOption: (item: T) => { value: string; label: string }) => {
  const suggested = new Set(suggestions);
  return [...items.filter((i) => suggested.has(i.id)), ...items.filter((i) => !suggested.has(i.id))].map(toOption);
};

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
  const editable = canEdit && !confirmed && !review.archivedAt;
  const defaultLokasyon = review.lokasyonId ?? (review.lokasyon.find((l) => /mağaza/i.test(l.name)) ?? review.lokasyon[0])?.id ?? "";

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      customerId: review.customerMatch.customerId ?? "",
      lokasyonId: defaultLokasyon,
      lines: review.lines.map((l) => ({
        productId: l.productId ?? (confirmed ? notInCatalogue : ""),
        fromStock: confirmed ? l.stockQuantity !== null : Boolean(l.productId) && !soldBeforeOpening(review, defaultLokasyon),
        quantity: decimal(l.stockQuantity ?? l.quantity),
      })),
    },
    disabled: !editable,
  });

  async function onSubmit(values: FormValues) {
    const result = await confirmInvoiceAction({
      id: review.id,
      customerId: values.customerId,
      lokasyonId: values.lokasyonId || null,
      lines: values.lines.map((l, i) => {
        const productId = l.productId === notInCatalogue ? null : l.productId;
        return { seq: review.lines[i].seq, productId, quantity: productId && l.fromStock ? l.quantity : null };
      }),
    });
    const stockNote = values.lines.some((l) => l.fromStock) ? (review.isReturn ? " Ürünler stoğa geri girdi." : " Ürünler stoktan düştü.") : "";
    if (toastResult(result, `Fatura ${review.number} onaylandı.${stockNote}`)) onDone();
  }

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
        </div>
        <SheetDescription className="tabular-nums">
          {day(review.issuedOn)} · {tl(Number(review.netAmount))} KDV hariç · {tl(Number(review.totalAmount))} KDV dahil
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
              {confirmed && (
                <Alert>
                  <CheckCircle2 />
                  <AlertDescription>
                    <span>
                      {review.confirmedAtText} tarihinde {review.confirmedBy ?? "bir kullanıcı"} onayladı.{" "}
                      {review.stockDocumentId ? (
                        <>
                          Satırlar {review.lokasyon.find((l) => l.id === review.lokasyonId)?.name ?? "stok"}{" "}
                          {review.isReturn ? "stoğuna geri girdi" : "stoğundan düştü"};{" "}
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
                <p className="text-muted-foreground truncate font-mono text-xs sm:text-right" title="ETTN">
                  {review.ettn}
                </p>
              </section>

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Müşteri</FormLabel>
                    <FormControl>
                      <Combobox
                        options={customerOptions}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={field.disabled}
                        placeholder="Müşteri ara"
                        className="w-full"
                      />
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

              <LokasyonField review={review} />

              <section className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-medium">Satırlar</h3>
                  {editable && (
                    <p className="text-muted-foreground text-xs">
                      Her satırı bir ürünle eşleştirin; {review.isReturn ? "stoğa geri girecekleri" : "stoktan düşecekleri"} işaretleyin.
                    </p>
                  )}
                </div>
                {review.lines.length === 0 && <p className="text-muted-foreground text-sm">Faturada okunabilen satır yok.</p>}
                {review.lines.map((line, i) => (
                  <LineFields key={line.seq} index={i} review={review} />
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
                    <EmptyTitle>PDF saklanmamış</EmptyTitle>
                    <EmptyDescription>
                      Bu fatura, PDF’ler saklanmaya başlamadan önce yüklendi. Aynı PDF’i ({review.fileName}) tekrar yüklerseniz buraya eklenir.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </TabsContent>
          </Tabs>

          {editable && (
            <SheetFooter className="flex-row justify-end border-t">
              <Button type="button" variant="outline" onClick={onDone}>
                Sonra
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Onaylanıyor…" : "Onayla"}
              </Button>
            </SheetFooter>
          )}
        </form>
      </Form>
    </>
  );
}

function LokasyonField({ review }: { review: InvoiceReview }) {
  const { control } = useFormContext<FormValues>();
  const lokasyonId = useWatch({ control, name: "lokasyonId" });
  const chosen = review.lokasyon.find((l) => l.id === lokasyonId);
  return (
    <FormField
      control={control}
      name="lokasyonId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{review.isReturn ? "Ürünlerin geri gireceği Lokasyon" : "Ürünlerin çıktığı Lokasyon"}</FormLabel>
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
          {chosen?.openedOn && !field.disabled && soldBeforeOpening(review, chosen.id) && (
            <Alert className="mt-1">
              <TriangleAlert />
              <AlertDescription>
                Bu fatura {chosen.name} açılış sayımından ({day(chosen.openedOn)}) önce kesilmiş; o satış sayımda zaten düşülmüş olabilir. Stoktan
                düşmeden onaylamak için satırların işaretini kaldırın.
              </AlertDescription>
            </Alert>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function LineFields({ index, review }: { index: number; review: InvoiceReview }) {
  const line = review.lines[index];
  const { control, setValue } = useFormContext<FormValues>();
  const [productId, fromStock, lokasyonId] = useWatch({ control, name: [`lines.${index}.productId`, `lines.${index}.fromStock`, "lokasyonId"] });
  const product = review.products.find((p) => p.id === productId);
  const options = useMemo(
    () => [
      { value: notInCatalogue, label: "Katalogda yok (stoğa dokunma)" },
      ...suggestedFirst(review.products, line.suggestions, (p) => ({ value: p.id, label: `${p.name} · ${p.code}` })),
    ],
    [line.suggestions, review.products],
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <p className="font-medium">
          <span className="text-muted-foreground mr-2 tabular-nums">{line.seq}.</span>
          {line.description}
        </p>
        <p className="text-muted-foreground tabular-nums">
          {decimal(line.quantity)} {line.unit} × {tl(Number(line.unitPrice))} = <span className="text-foreground">{tl(Number(line.amount))}</span>
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_8rem] sm:items-start">
        <FormField
          control={control}
          name={`lines.${index}.productId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">{line.seq}. satırın ürünü</FormLabel>
              <FormControl>
                <Combobox
                  options={options}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    setValue(`lines.${index}.fromStock`, value !== notInCatalogue && !soldBeforeOpening(review, lokasyonId));
                  }}
                  disabled={field.disabled}
                  placeholder="Ürün ara"
                  className="w-full"
                />
              </FormControl>
              {!field.disabled && !field.value && line.suggestions.length > 0 && <FormDescription>Benzeyen ürünler listenin başında.</FormDescription>}
              {!field.disabled && field.value && field.value === line.productId && <FormDescription>Otomatik eşleşti; kontrol edin.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`lines.${index}.fromStock`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 sm:h-9">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  disabled={field.disabled || !productId || productId === notInCatalogue}
                />
              </FormControl>
              <FormLabel className="font-normal whitespace-nowrap">{review.isReturn ? "Stoğa geri al" : "Stoktan düş"}</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`lines.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Stok miktarı</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input {...field} inputMode="decimal" className="tabular-nums" disabled={field.disabled || !fromStock} />
                </FormControl>
                <span className="text-muted-foreground text-xs">{product ? unitLabels[product.unit] : line.unit}</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
