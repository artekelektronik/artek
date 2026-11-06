"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Subscribe, type ReactTable } from "@tanstack/react-table";
import { Archive, ArchiveRestore, FileText, MoreHorizontal, PanelRightOpen } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@artek/ui/components/dialog";
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
import { columnHelperFor, option, searchColumn, useClientDataTable } from "@/components/data-table/columns";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { day, tl } from "@/lib/finance-calc";
import { archiveInvoiceAction, restoreInvoiceAction } from "./actions";

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
  hasFile: boolean;
  archivedAt: string | null;
  archiveReason: string | null;
};

const column = columnHelperFor<InvoiceRow>();
const kindOf = (r: InvoiceRow) => (r.type === "IADE" ? "İade" : r.scenario === "EARSIVFATURA" ? "e-Arşiv" : "e-Fatura");
const statusOf = (r: InvoiceRow) => (r.status === "taslak" ? "Onay bekliyor" : "Onaylı");
const pdfUrl = (id: string) => `/api/faturalar/${id}/pdf`;

// The invoice list on the shared tablecn table: search, date range, type and status filters live in the URL.
// A fatura number opens the review sheet (?fatura=) without losing those filters.
export function InvoiceTable({ rows: all, linkCustomers, canEdit }: { rows: InvoiceRow[]; linkCustomers: boolean; canEdit: boolean }) {
  const [showArchived, setShowArchived] = useState(false);
  const archivedCount = all.filter((r) => r.archivedAt).length;
  const rows = useMemo(() => all.filter((r) => Boolean(r.archivedAt) === showArchived), [all, showArchived]);
  const open = useOpenInvoice();

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
      size: 230,
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
      size: 320,
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
    column.accessor(kindOf, {
      id: "tur",
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tür" />,
      enableColumnFilter: true,
      meta: { label: "Tür", variant: "multiSelect", options: ["e-Fatura", "e-Arşiv", "İade"].map(option) },
    }),
    column.accessor(statusOf, {
      id: "durum",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Durum" />,
      cell: ({ row }) =>
        row.original.status === "taslak" ? (
          <Badge variant="outline" className="border-amber-300 text-amber-800 dark:text-amber-200">
            Onay bekliyor
          </Badge>
        ) : (
          <Badge variant="secondary">Onaylı</Badge>
        ),
      enableColumnFilter: true,
      meta: { label: "Durum", variant: "multiSelect", options: ["Onay bekliyor", "Onaylı"].map(option) },
    }),
    column.accessor((r) => Number(r.netAmount), {
      id: "tutar",
      size: 120,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tutar" className="justify-end" />,
      cell: ({ row }) => <span className="block text-right tabular-nums">{tl(Number(row.original.netAmount))}</span>,
      meta: { label: "Tutar" },
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

// Sales and returns of the rows the filters leave; only confirmed invoices are sales, drafts are counted apart.
function Totals({ table }: { table: ReactTable<DataTableFeatures, InvoiceRow, unknown> }) {
  return (
    <Subscribe source={table.atoms.columnFilters} selector={(filters) => filters}>
      {() => {
        const shown = table.getFilteredRowModel().rows.map((r) => r.original);
        const confirmed = shown.filter((r) => r.status === "onaylandi");
        const sales = confirmed.filter((r) => r.type !== "IADE").reduce((s, r) => s + Number(r.netAmount), 0);
        const returns = confirmed.filter((r) => r.type === "IADE").reduce((s, r) => s + Number(r.netAmount), 0);
        const waiting = shown.length - confirmed.length;
        return (
          <p className="text-muted-foreground text-xs tabular-nums">
            <b className="text-foreground font-medium">{shown.length.toLocaleString("tr-TR")}</b> fatura · satış{" "}
            <b className="text-foreground font-medium">{tl(sales)}</b>
            {returns > 0 && <> · iade {tl(returns)}</>}
            {waiting > 0 && <> · {waiting.toLocaleString("tr-TR")} onay bekliyor</>}
          </p>
        );
      }}
    </Subscribe>
  );
}

// Opens the review sheet on top of the current URL, so the table keeps its filters, sort and page. Read at click
// time: the table writes its filters to the URL without a render here.
function useOpenInvoice() {
  const router = useRouter();
  return (id: string) => (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return; // a new tab gets the plain link
    event.preventDefault();
    const next = new URLSearchParams(window.location.search);
    next.set("fatura", id);
    router.push(`${window.location.pathname}?${next}`, { scroll: false });
  };
}

function RowActions({ row, canEdit, onOpen }: { row: InvoiceRow; canEdit: boolean; onOpen: (event: React.MouseEvent) => void }) {
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);
  const [pending, start] = useTransition();
  const done = (result: { error?: string } | undefined, message: string) => {
    if (result?.error) {
      toast.error(result.error);
      return false;
    }
    toast.success(message);
    router.refresh();
    return true;
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
                <DropdownMenuItem variant="destructive" onSelect={() => setArchiving(true)}>
                  <Archive /> Arşivle…
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={archiving} onOpenChange={setArchiving}>
        <DialogContent className="sm:max-w-md">
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
              start(async () => {
                if (done(await archiveInvoiceAction(row.id, reason), "Arşivlendi.")) setArchiving(false);
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>{row.number} arşivlensin mi?</DialogTitle>
              <DialogDescription>
                Arşivdeki fatura listeden ve toplamlardan çıkar; istediğinizde geri alabilirsiniz. Stoktan düşülmüş onaylı bir fatura arşivlenemez.
              </DialogDescription>
            </DialogHeader>
            <Label className="flex-col items-stretch gap-1">
              Sebep
              <Input name="reason" autoFocus placeholder="ör. iptal edildi, yanlış yüklendi" className="font-normal" />
            </Label>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Vazgeç
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Arşivleniyor…" : "Arşivle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
