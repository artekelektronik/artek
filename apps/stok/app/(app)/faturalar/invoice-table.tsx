"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { ReactTable } from "@tanstack/react-table";
import { Archive, ArchiveRestore, FileText, MoreHorizontal, PanelRightOpen, Trash2 } from "lucide-react";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@artek/ui/components/dropdown-menu";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { FilteredRows } from "@/components/data-table/filtered-rows";
import { columnHelperFor, option, searchColumn, useClientDataTable } from "@/components/data-table/columns";
import { FormDialog } from "@/components/form-dialog";
import { toastResult } from "@/components/form-status";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { day, kdvRateLabel, tl } from "@/lib/finance-calc";
import { invoiceKind, invoiceKinds, invoiceStatusLabels } from "@/lib/labels";
import { archiveInvoiceAction, restoreInvoiceAction } from "./actions";
import { DeleteInvoiceDialog } from "./invoice-delete";
import { InvoiceStatusBadge } from "./invoice-status";
import { useFatura } from "./use-fatura";

export type InvoiceRow = {
  id: string;
  number: string;
  scenario: string;
  type: string;
  issuedOn: string;
  netAmount: string;
  totalAmount: string;
  status: "taslak" | "onaylandi";
  manual: boolean;
  customerId: string | null;
  customer: string;
  hasFile: boolean;
  archivedAt: string | null;
  archiveReason: string | null;
};

const column = columnHelperFor<InvoiceRow>();
export const pdfUrl = (id: string) => `/api/faturalar/${id}/pdf`;

export function InvoiceTable({ rows: all, linkCustomers, canEdit }: { rows: InvoiceRow[]; linkCustomers: boolean; canEdit: boolean }) {
  const [showArchived, setShowArchived] = useState(false);
  const archivedCount = all.filter((r) => r.archivedAt).length;
  const rows = useMemo(() => all.filter((r) => Boolean(r.archivedAt) === showArchived), [all, showArchived]);
  const [, setFatura] = useFatura();
  // Plain links still work in a new tab; a normal click opens the sheet over the current filters.
  const open = (id: string) => (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    setFatura(id);
  };

  const columns = column.columns([
    searchColumn<InvoiceRow>((r) => `${r.number} ${r.customer}`, "Fatura no veya müşteri ara"),
    column.accessor((r) => new Date(`${r.issuedOn}T00:00:00`), {
      id: "tarih",
      size: 110,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tarih" />,
      cell: ({ row }) => <span className="tabular-nums">{day(row.original.issuedOn)}</span>,
      enableColumnFilter: true,
      meta: { label: "Tarih", variant: "dateRange" },
    }),
    column.accessor("number", {
      id: "no",
      size: 200,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Fatura no" />,
      cell: ({ row }) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Link
            href={`/faturalar?fatura=${row.original.id}`}
            onClick={open(row.original.id)}
            className="font-medium tabular-nums underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-foreground"
          >
            {row.original.number}
          </Link>
          {row.original.manual && <Badge variant="outline">Elle</Badge>}
          {row.original.hasFile && (
            <a href={pdfUrl(row.original.id)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" title="Orijinal PDF">
              <FileText className="size-4" />
              <span className="sr-only">Orijinal PDF</span>
            </a>
          )}
        </span>
      ),
      meta: { label: "Fatura no" },
      enableHiding: false,
    }),
    column.accessor("customer", {
      id: "musteri",
      size: 240,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Müşteri" />,
      cell: ({ row }) =>
        linkCustomers && row.original.customerId ? (
          <Link href={`/musteriler?secili=${row.original.customerId}`} className="block max-w-80 truncate underline-offset-4 hover:underline">
            {row.original.customer}
          </Link>
        ) : (
          <span className="block max-w-80 truncate">{row.original.customer}</span>
        ),
      meta: { label: "Müşteri" },
    }),
    column.accessor(invoiceKind, {
      id: "tur",
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tür" />,
      enableColumnFilter: true,
      meta: { label: "Tür", variant: "multiSelect", options: invoiceKinds.map(option) },
    }),
    column.accessor((r) => invoiceStatusLabels[r.status], {
      id: "durum",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Durum" />,
      cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
      enableColumnFilter: true,
      meta: { label: "Durum", variant: "multiSelect", options: Object.values(invoiceStatusLabels).map(option) },
    }),
    column.accessor((r) => Number(r.netAmount), {
      id: "tutar",
      size: 120,
      header: ({ column }) => <DataTableColumnHeader column={column} label="KDV hariç" className="justify-end" />,
      cell: ({ row }) => <span className="block text-right font-medium tabular-nums">{tl(Number(row.original.netAmount))}</span>,
      meta: { label: "KDV hariç" },
    }),
    column.accessor((r) => Number(r.totalAmount), {
      id: "kdvDahil",
      size: 150,
      header: ({ column }) => <DataTableColumnHeader column={column} label="KDV dahil" className="justify-end" />,
      cell: ({ row }) => {
        const { netAmount, totalAmount } = row.original;
        return (
          <span className="flex flex-col items-end tabular-nums">
            {tl(Number(totalAmount))}
            <span className="text-muted-foreground text-xs">
              KDV {tl(Number(totalAmount) - Number(netAmount))} · {kdvRateLabel(Number(netAmount), Number(totalAmount))}
            </span>
          </span>
        );
      },
      meta: { label: "KDV dahil" },
    }),
    column.display({
      id: "islemler",
      size: 48,
      cell: ({ row }) => <RowActions row={row.original} canEdit={canEdit} onOpen={open(row.original.id)} />,
      enableHiding: false,
      enableSorting: false,
    }),
  ]);

  const { table } = useClientDataTable({ data: rows, columns, sorting: [{ id: "tarih", desc: true }] });

  return (
    <DataTable table={table} aria-label="Faturalar">
      <DataTableToolbar table={table}>
        {(archivedCount > 0 || showArchived) && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Faturalara dön" : `Arşivdekiler (${archivedCount})`}
          </Button>
        )}
      </DataTableToolbar>
      <Totals table={table} />
    </DataTable>
  );
}

// Over the filtered rows; only confirmed invoices are sales.
function Totals({ table }: { table: ReactTable<DataTableFeatures, InvoiceRow, unknown> }) {
  return (
    <FilteredRows table={table}>
      {(shown) => {
        const confirmed = shown.filter((r) => r.status === "onaylandi");
        const sum = (rows: InvoiceRow[], key: "netAmount" | "totalAmount" = "netAmount") => rows.reduce((s, r) => s + Number(r[key]), 0);
        const sold = confirmed.filter((r) => r.type !== "IADE");
        const sales = sum(sold);
        const salesWithKdv = sum(sold, "totalAmount");
        const returns = sum(confirmed.filter((r) => r.type === "IADE"));
        const waiting = shown.length - confirmed.length;
        return (
          <p className="text-muted-foreground text-xs tabular-nums">
            <b className="text-foreground font-medium">{shown.length.toLocaleString("tr-TR")}</b> fatura · satış{" "}
            <b className="text-foreground font-medium">{tl(sales)}</b> KDV hariç · {tl(salesWithKdv)} KDV dahil
            {returns > 0 && <> · iade {tl(returns)}</>}
            {waiting > 0 && <> · {waiting.toLocaleString("tr-TR")} onay bekliyor</>}
          </p>
        );
      }}
    </FilteredRows>
  );
}

function RowActions({ row, canEdit, onOpen }: { row: InvoiceRow; canEdit: boolean; onOpen: (event: React.MouseEvent) => void }) {
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, start] = useTransition();
  const done = (result: Awaited<ReturnType<typeof restoreInvoiceAction>>, message: string) => {
    const saved = toastResult(result, message);
    if (saved) router.refresh();
    return saved;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label={`${row.number} için işlemler`} disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/faturalar?fatura=${row.id}`} onClick={onOpen}>
              <PanelRightOpen /> {row.status === "taslak" && canEdit ? "İncele ve onayla" : "Faturayı aç"}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild disabled={!row.hasFile}>
            <a href={pdfUrl(row.id)} target="_blank" rel="noreferrer">
              <FileText /> {row.hasFile ? "Orijinal PDF" : "PDF saklanmamış"}
            </a>
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              {row.archivedAt ? (
                <DropdownMenuItem onSelect={() => start(async () => void done(await restoreInvoiceAction(row.id), "Arşivden çıkarıldı."))}>
                  <ArchiveRestore /> Arşivden çıkar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setArchiving(true)}>
                  <Archive /> Arşivle…
                </DropdownMenuItem>
              )}
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                <Trash2 /> Sil…
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialog
        open={archiving}
        onOpenChange={setArchiving}
        className="sm:max-w-md"
        title={`${row.number} arşivlensin mi?`}
        description="Arşivdeki fatura listeden ve toplamlardan çıkar; geri alınabilir. Stoktan düşülmüş onaylı fatura arşivlenemez."
        submitLabel="Arşivle"
        pendingLabel="Arşivleniyor…"
        destructive
        onSubmit={async (formData) => done(await archiveInvoiceAction(row.id, String(formData.get("reason") ?? "")), "Arşivlendi.")}
      >
        <Label className="flex-col items-stretch gap-1">
          Sebep
          <Input name="reason" autoFocus placeholder="ör. iptal edildi, yanlış yüklendi" className="font-normal" />
        </Label>
      </FormDialog>
      <DeleteInvoiceDialog invoice={row} open={deleting} onOpenChange={setDeleting} onDeleted={() => router.refresh()} />
    </>
  );
}
