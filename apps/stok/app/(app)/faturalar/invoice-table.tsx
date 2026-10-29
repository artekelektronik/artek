"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@artek/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { cn } from "@artek/ui/lib/utils";
import { DatePicker } from "@/components/date-picker";
import { FormSelect } from "@/components/form-select";
import { day, tl } from "@/lib/finance-calc";
import { filterInvoices, invoiceDatePresets, invoiceRange, invoiceTotals, type InvoiceDatePreset, type InvoiceFilter } from "@/lib/list-filters";

export type InvoiceRow = {
  id: string;
  number: string;
  scenario: string;
  type: string;
  issuedOn: string;
  netAmount: string;
  customerId: string;
  customer: string;
};

type SortKey = "issuedOn" | "number" | "customer" | "netAmount";
const typeOptions = [
  { value: "tumu", label: "Satış ve iade" },
  { value: "satis", label: "Sadece satış" },
  { value: "iade", label: "Sadece iade" },
];

export function InvoiceTable({ rows, today, linkCustomers }: { rows: InvoiceRow[]; today: string; linkCustomers: boolean }) {
  const [preset, setPreset] = useState<InvoiceDatePreset>("tumu");
  const [custom, setCustom] = useState<{ from?: string; to?: string }>({});
  const [q, setQ] = useState("");
  const [type, setType] = useState<InvoiceFilter["type"]>("tumu");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "issuedOn", dir: -1 });

  const visible = useMemo(() => {
    const shown = filterInvoices(rows, { range: invoiceRange(preset, today, custom), q, type });
    return shown.sort((a, b) => {
      const c = sort.key === "netAmount" ? Number(a.netAmount) - Number(b.netAmount) : a[sort.key].localeCompare(b[sort.key], "tr");
      return c !== 0 ? c * sort.dir : b.issuedOn.localeCompare(a.issuedOn);
    });
  }, [rows, preset, custom, q, type, sort, today]);
  const totals = invoiceTotals(visible);
  const filtered = preset !== "tumu" || q || type !== "tumu";

  const header = (key: SortKey, label: string, numeric = false) => (
    <TableHead aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : undefined} className={cn(numeric && "text-right")}>
      <button
        type="button"
        className="hover:text-foreground"
        onClick={() => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "issuedOn" || key === "netAmount" ? -1 : 1 }))}
      >
        {label}
        {sort.key === key && (sort.dir === 1 ? " ↑" : " ↓")}
      </button>
    </TableHead>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Müşteri veya fatura no ara"
          aria-label="Fatura ara"
          className="max-w-xs flex-1"
        />
        <FormSelect
          name="tarih"
          options={Object.entries(invoiceDatePresets).map(([value, label]) => ({ value, label }))}
          defaultValue={preset}
          onValueChange={(v) => setPreset(v as InvoiceDatePreset)}
          aria-label="Tarih"
          className="w-44"
        />
        {preset === "ozel" && (
          <span className="flex flex-wrap items-center gap-1 text-sm">
            <DatePicker id="fatura-baslangic" name="from" onChange={(from) => setCustom((c) => ({ ...c, from: from || undefined }))} />
            <span className="text-muted-foreground">–</span>
            <DatePicker id="fatura-bitis" name="to" onChange={(to) => setCustom((c) => ({ ...c, to: to || undefined }))} />
          </span>
        )}
        <FormSelect
          name="tur"
          options={typeOptions}
          defaultValue={type}
          onValueChange={(v) => setType(v as InvoiceFilter["type"])}
          aria-label="Tür"
          className="w-40"
        />
      </div>
      <p className="text-muted-foreground text-xs tabular-nums">
        <b className="text-foreground font-medium">{visible.length.toLocaleString("tr-TR")}</b> fatura · satış <b className="text-foreground font-medium">{tl(totals.sales)}</b>
        {totals.returns > 0 && <> · iade {tl(totals.returns)}</>}
        {filtered && " (seçilenler)"}
      </p>

      <div className="max-h-[36rem] overflow-auto">
        {visible.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {rows.length === 0 ? "Henüz fatura yok. Yukarıdan ilk faturaları yükleyin." : "Bu seçime uyan fatura yok."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {header("issuedOn", "Tarih")}
                {header("number", "Fatura no")}
                {header("customer", "Müşteri")}
                <TableHead>Tür</TableHead>
                {header("netAmount", "Tutar", true)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="tabular-nums">{day(r.issuedOn)}</TableCell>
                  <TableCell className="tabular-nums">{r.number}</TableCell>
                  <TableCell className="max-w-80 truncate">
                    {linkCustomers ? (
                      <Link href={`/musteriler?secili=${r.customerId}`} className="underline-offset-4 hover:underline">
                        {r.customer}
                      </Link>
                    ) : (
                      r.customer
                    )}
                  </TableCell>
                  <TableCell>{r.type === "IADE" ? "İade" : r.scenario === "EARSIVFATURA" ? "e-Arşiv" : "e-Fatura"}</TableCell>
                  <TableCell className="text-right tabular-nums">{tl(Number(r.netAmount))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

