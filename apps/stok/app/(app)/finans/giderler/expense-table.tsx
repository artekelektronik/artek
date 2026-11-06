"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Subscribe, type ReactTable } from "@tanstack/react-table";
import { parseAsString, useQueryState } from "nuqs";
import { MoreHorizontal, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@artek/ui/components/dropdown-menu";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor, options, searchColumn, useClientDataTable } from "@/components/data-table/columns";
import { FormDialog } from "@/components/form-dialog";
import { toastResult } from "@/components/form-status";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { day, tl } from "@/lib/finance-calc";
import { deleteExpenseAction } from "./actions";

export type ExpenseRow = {
  id: string;
  spentOn: string;
  category: string;
  description: string;
  party: string | null;
  netAmount: string;
  kdvRate: string;
  totalAmount: string;
  fileName: string | null;
};

const column = columnHelperFor<ExpenseRow>();
export const receiptUrl = (id: string) => `/api/giderler/${id}/dosya`;

// ?gider=yeni opens an empty sheet, ?gider=<id> that expense.
export const useOpenExpense = () => useQueryState("gider", parseAsString);

export function AddExpenseButton() {
  const [, open] = useOpenExpense();
  return (
    <Button onClick={() => open("yeni")}>
      <Plus /> Gider ekle
    </Button>
  );
}

export function ExpenseTable({ rows, canEdit }: { rows: ExpenseRow[]; canEdit: boolean }) {
  const [, open] = useOpenExpense();
  const columns = column.columns([
    searchColumn<ExpenseRow>((r) => `${r.category} ${r.description} ${r.party ?? ""}`, "Açıklama, kime veya kategori ara"),
    column.accessor((r) => new Date(`${r.spentOn}T00:00:00`), {
      id: "tarih",
      size: 110,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tarih" />,
      cell: ({ row }) => <span className="tabular-nums">{day(row.original.spentOn)}</span>,
      enableColumnFilter: true,
      meta: { label: "Tarih", variant: "dateRange" },
    }),
    column.accessor("category", {
      id: "kategori",
      size: 160,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kategori" />,
      enableColumnFilter: true,
      meta: { label: "Kategori", variant: "multiSelect", options: options(rows.map((r) => r.category)) },
    }),
    column.accessor((r) => r.description || r.party || "", {
      id: "aciklama",
      size: 320,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Açıklama" />,
      cell: ({ row }) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{row.original.description || "—"}</span>
          {row.original.party && <span className="text-muted-foreground truncate text-xs">{row.original.party}</span>}
        </span>
      ),
      meta: { label: "Açıklama" },
    }),
    column.accessor((r) => Number(r.netAmount), {
      id: "net",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} label="KDV hariç" className="justify-end" />,
      cell: ({ row }) => <span className="block text-right font-medium tabular-nums">{tl(Number(row.original.netAmount))}</span>,
      meta: { label: "KDV hariç" },
    }),
    column.accessor((r) => Number(r.totalAmount), {
      id: "toplam",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} label="KDV dahil" className="justify-end" />,
      cell: ({ row }) => <span className="text-muted-foreground block text-right tabular-nums">{tl(Number(row.original.totalAmount))}</span>,
      meta: { label: "KDV dahil" },
    }),
    column.display({
      id: "islemler",
      size: 80,
      cell: ({ row }) => (
        <span className="flex items-center justify-end gap-1">
          {row.original.fileName && (
            <a href={receiptUrl(row.original.id)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground p-1" title="Fiş">
              <Paperclip className="size-4" />
              <span className="sr-only">Fiş</span>
            </a>
          )}
          <RowActions row={row.original} canEdit={canEdit} onOpen={() => open(row.original.id)} />
        </span>
      ),
      enableHiding: false,
      enableSorting: false,
    }),
  ]);
  const { table } = useClientDataTable({ data: rows, columns, sorting: [{ id: "tarih", desc: true }] });

  return (
    <DataTable table={table} aria-label="Giderler">
      <DataTableToolbar table={table} />
      <Totals table={table} />
    </DataTable>
  );
}

function Totals({ table }: { table: ReactTable<DataTableFeatures, ExpenseRow, unknown> }) {
  return (
    <Subscribe source={table.atoms.columnFilters} selector={(filters) => filters}>
      {() => {
        const shown = table.getFilteredRowModel().rows.map((r) => r.original);
        const sum = (key: "netAmount" | "totalAmount") => shown.reduce((s, r) => s + Number(r[key]), 0);
        return (
          <p className="text-muted-foreground text-xs tabular-nums">
            <b className="text-foreground font-medium">{shown.length.toLocaleString("tr-TR")}</b> gider · KDV hariç{" "}
            <b className="text-foreground font-medium">{tl(sum("netAmount"))}</b> · KDV dahil {tl(sum("totalAmount"))}
          </p>
        );
      }}
    </Subscribe>
  );
}

function RowActions({ row, canEdit, onOpen }: { row: ExpenseRow; canEdit: boolean; onOpen: () => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label={`${row.category} için işlemler`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onOpen}>
            <Pencil /> {canEdit ? "Düzenle" : "Aç"}
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                <Trash2 /> Sil…
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <FormDialog
        open={deleting}
        onOpenChange={setDeleting}
        className="sm:max-w-md"
        title="Gider silinsin mi?"
        description={`${row.category} · ${tl(Number(row.netAmount))} · ${day(row.spentOn)}. Fişiyle birlikte kalıcı olarak silinir.`}
        submitLabel="Sil"
        pendingLabel="Siliniyor…"
        destructive
        onSubmit={async () => {
          const ok = toastResult(await deleteExpenseAction(row.id), "Gider silindi.");
          if (ok) router.refresh();
          return ok;
        }}
      >
        {null}
      </FormDialog>
    </>
  );
}
