"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@artek/ui/components/badge";
import { Input } from "@artek/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { cn } from "@artek/ui/lib/utils";
import { DatePicker } from "@/components/date-picker";
import { ArchiveControl } from "@/components/archive-control";
import { FormSelect } from "@/components/form-select";
import { SortBar, type SortField } from "@/components/sort-bar";
import { day, tl } from "@/lib/finance-calc";
import { sortRows, type Sort } from "@/lib/sorting";
import { archiveInvoiceAction, restoreInvoiceAction } from "./actions";
import { filterInvoices, invoiceDatePresets, invoiceRange, invoiceTotals, type InvoiceDatePreset, type InvoiceFilter } from "@/lib/list-filters";

export type InvoiceRow = {
  id: string;
  number: string;
  scenario: string;
  type: string;
  issuedOn: string;
  netAmount: string;
  status: "taslak" | "onaylandi";
  customerId: string | null; // null: a draft whose buyer is not a Müşteri yet
  customer: string;
  archivedAt: string | null;
  archiveReason: string | null;
};

type SortKey = "issuedOn" | "number" | "customer" | "netAmount";
const sortFields: SortField[] = [
  { id: "issuedOn", label: "Tarih", kind: "date" },
  { id: "number", label: "Fatura no", kind: "text" },
  { id: "customer", label: "Müşteri", kind: "text" },
  { id: "netAmount", label: "Tutar", kind: "number" },
];
const typeOptions = [
  { value: "tumu", label: "Satış ve iade" },
  { value: "satis", label: "Sadece satış" },
  { value: "iade", label: "Sadece iade" },
];
const statusOptions = [
  { value: "tumu", label: "Onaylı ve bekleyen" },
  { value: "taslak", label: "Onay bekliyor" },
  { value: "onaylandi", label: "Onaylı" },
];

export function InvoiceTable({ rows: all, today, linkCustomers, canEdit }: { rows: InvoiceRow[]; today: string; linkCustomers: boolean; canEdit: boolean }) {
  const [showArchived, setShowArchived] = useState(false);
  const archivedCount = all.filter((r) => r.archivedAt).length;
  const [status, setStatus] = useState<"tumu" | InvoiceRow["status"]>("tumu");
  const rows = useMemo(
    () => all.filter((r) => Boolean(r.archivedAt) === showArchived && (status === "tumu" || r.status === status)),
    [all, showArchived, status],
  );
  const [preset, setPreset] = useState<InvoiceDatePreset>("tumu");
  const [custom, setCustom] = useState<{ from?: string; to?: string }>({});
  const [q, setQ] = useState("");
  const [type, setType] = useState<InvoiceFilter["type"]>("tumu");
  const [sorts, setSorts] = useState<Sort[]>([{ id: "issuedOn", desc: true }]);

  const visible = useMemo(() => {
    const shown = filterInvoices(rows, { range: invoiceRange(preset, today, custom), q, type });
    return sortRows(shown, [...sorts, { id: "issuedOn", desc: true }], (r, id) => (id === "netAmount" ? Number(r.netAmount) : r[id as SortKey]));
  }, [rows, preset, custom, q, type, sorts, today]);
  // Only confirmed invoices are sales; drafts are counted apart.
  const totals = invoiceTotals(visible.filter((r) => r.status === "onaylandi"));
  const waiting = visible.filter((r) => r.status === "taslak").length;
  const filtered = preset !== "tumu" || q || type !== "tumu" || status !== "tumu";

  const header = (key: SortKey, label: string, numeric = false) => (
    <TableHead aria-sort={sorts[0]?.id === key ? (sorts[0].desc ? "descending" : "ascending") : undefined} className={cn(numeric && "text-right")}>
      <button
        type="button"
        className="hover:text-foreground"
        onClick={() => setSorts((s) => [{ id: key, desc: s[0]?.id === key ? !s[0].desc : key === "issuedOn" || key === "netAmount" }])}
      >
        {label}
        {sorts[0]?.id === key && (sorts[0].desc ? " ↓" : " ↑")}
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
        <FormSelect
          name="durum"
          options={statusOptions}
          defaultValue={status}
          onValueChange={(v) => setStatus(v as typeof status)}
          aria-label="Durum"
          className="w-44"
        />
        {(archivedCount > 0 || showArchived) && (
          <button type="button" className="text-muted-foreground text-xs underline-offset-4 hover:underline" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Faturalara dön" : `Arşivdekiler (${archivedCount})`}
          </button>
        )}
      </div>
      <SortBar fields={sortFields} sorts={sorts} onChange={setSorts} />
      <p className="text-muted-foreground text-xs tabular-nums">
        <b className="text-foreground font-medium">{visible.length.toLocaleString("tr-TR")}</b> fatura · satış <b className="text-foreground font-medium">{tl(totals.sales)}</b>
        {totals.returns > 0 && <> · iade {tl(totals.returns)}</>}
        {waiting > 0 && <> · {waiting.toLocaleString("tr-TR")} onay bekliyor</>}
        {filtered && " (seçilenler)"}
      </p>

      <div className="max-h-[36rem] overflow-auto">
        {visible.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {showArchived ? "Arşivde fatura yok." : all.length === 0 ? "Henüz fatura yok. Yukarıdan ilk faturaları yükleyin." : "Bu seçime uyan fatura yok."}
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
                {canEdit && <TableHead className="w-0" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="tabular-nums">{day(r.issuedOn)}</TableCell>
                  <TableCell className="tabular-nums">
                    <Link href={`/faturalar?fatura=${r.id}`} scroll={false} className="font-medium underline-offset-4 hover:underline">
                      {r.number}
                    </Link>
                    {r.status === "taslak" && (
                      <Badge variant="outline" className="ml-2 border-amber-300 text-amber-800 dark:text-amber-200">
                        Onay bekliyor
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-80 truncate">
                    {linkCustomers && r.customerId ? (
                      <Link href={`/musteriler?secili=${r.customerId}`} className="underline-offset-4 hover:underline">
                        {r.customer}
                      </Link>
                    ) : (
                      r.customer
                    )}
                  </TableCell>
                  <TableCell>{r.type === "IADE" ? "İade" : r.scenario === "EARSIVFATURA" ? "e-Arşiv" : "e-Fatura"}</TableCell>
                  <TableCell className="text-right tabular-nums">{tl(Number(r.netAmount))}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right whitespace-nowrap">
                      {r.archiveReason && <span className="text-muted-foreground mr-2 text-xs">{r.archiveReason}</span>}
                      <ArchiveControl
                        compact
                        archived={Boolean(r.archivedAt)}
                        onArchive={(reason) => archiveInvoiceAction(r.id, reason)}
                        onRestore={() => restoreInvoiceAction(r.id)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

