"use client";

import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor, hiddenSearch, searchColumn } from "@/components/data-table/columns";
import { useDataTable } from "@/hooks/use-data-table";
import { reverseMovementAction } from "@/app/(app)/hareketler/actions";
import type { listMovements } from "@/lib/ledger";
import { displayQuantity, formatDateTime, movementTypeLabels } from "@/lib/labels";
import { unitLabels } from "@/lib/quantity";
import { ReverseButton } from "./reverse-button";

type Movement = Awaited<ReturnType<typeof listMovements>>[number];

const column = columnHelperFor<Movement>();
const options = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "tr")).map((v) => ({ label: v, value: v }));
const document = (m: Movement) => [m.supplier, m.reference, m.reason].filter(Boolean).join(" · ");

export function MovementTable({ movements, canReverse }: { movements: Movement[]; canReverse: boolean }) {
  const reversed = new Set(movements.map((m) => m.reversesId).filter(Boolean));

  const columns = column.columns([
    searchColumn<Movement>((m) => [m.productCode, m.productName, document(m), m.userName].join(" "), "Ürün, belge veya neden"),
    column.accessor("createdAt", {
      id: "zaman",
      size: 160,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Zaman" />,
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>,
      meta: { label: "Zaman" },
    }),
    column.accessor((m) => movementTypeLabels[m.type], {
      id: "tur",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tür" />,
      cell: ({ row }) => (
        <>
          {movementTypeLabels[row.original.type]}
          {row.original.reversesId && <span className="text-muted-foreground"> (ters kayıt)</span>}
        </>
      ),
      enableColumnFilter: true,
      meta: { label: "Tür", variant: "multiSelect", options: options(movements.map((m) => movementTypeLabels[m.type])) },
    }),
    column.accessor("productCode", {
      id: "urun",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Ürün" />,
      cell: ({ row }) => (
        <Link href={`/urunler/${row.original.productId}`} className="font-mono underline-offset-4 hover:underline">
          {row.original.productCode}
        </Link>
      ),
      meta: { label: "Ürün" },
    }),
    column.accessor((m) => m.lokasyonName ?? "Yolda", {
      id: "lokasyon",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Lokasyon" />,
      enableColumnFilter: true,
      meta: { label: "Lokasyon", variant: "multiSelect", options: options(movements.map((m) => m.lokasyonName ?? "Yolda")) },
    }),
    column.accessor((m) => Number(m.quantity), {
      id: "miktar",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Miktar" className="ml-auto" />,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {displayQuantity(row.original.quantity)} {unitLabels[row.original.unit]}
        </div>
      ),
      meta: { label: "Miktar" },
    }),
    column.accessor("userName", {
      id: "kullanici",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kullanıcı" />,
      enableColumnFilter: true,
      meta: { label: "Kullanıcı", variant: "multiSelect", options: options(movements.map((m) => m.userName)) },
    }),
    column.accessor((m) => document(m), {
      id: "belge",
      size: 280,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Belge / neden" />,
      cell: ({ cell }) => <div className="max-w-64 truncate">{cell.getValue()}</div>,
      enableSorting: false,
      meta: { label: "Belge / neden" },
    }),
    ...(canReverse
      ? [
          column.display({
            id: "ters",
            header: () => null,
            cell: ({ row }) =>
              !row.original.reversesId &&
              !reversed.has(row.original.id) && <ReverseButton action={reverseMovementAction.bind(null, row.original.id)} />,
            enableHiding: false,
          }),
        ]
      : []),
  ]);

  const { table } = useDataTable({
    mode: "client",
    data: movements,
    columns,
    initialState: { ...hiddenSearch, sorting: [{ id: "zaman", desc: true }], pagination: { pageIndex: 0, pageSize: 20 } },
    getRowId: (row) => row.id,
  });

  return (
    <DataTable table={table} aria-label="Stok hareketleri">
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
