"use client";

import Link from "next/link";
import { cn } from "@artek/ui/lib/utils";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor, options, searchColumn, useClientDataTable } from "@/components/data-table/columns";
import { reverseMovementAction } from "@/app/(app)/hareketler/actions";
import type { listMovements } from "@/lib/ledger";
import { tl } from "@/lib/finance-calc";
import { displayQuantity, formatDateTime, movementTypeLabels } from "@/lib/labels";
import { unitLabels } from "@/lib/quantity";
import { ReverseButton } from "./reverse-button";
import { CategoryBadge, MovementTypeBadge } from "./stock-badges";

type Movement = Awaited<ReturnType<typeof listMovements>>[number];

const column = columnHelperFor<Movement>();
const document = (m: Movement) => [m.supplier, m.reference, m.reason].filter(Boolean).join(" · ");

// `values` (movement id to TL) is passed only to a Finans paneli holder; without it there is no Tutar column.
export function MovementTable({
  movements,
  canReverse,
  values,
}: {
  movements: Movement[];
  canReverse: boolean;
  values?: Record<string, number | null>;
}) {
  const reversed = new Set(movements.map((m) => m.reversesId).filter(Boolean));

  const columns = column.columns([
    searchColumn<Movement>((m) => [m.productCode, m.productName, m.productCategory, document(m), m.userName].join(" "), "Ürün, kategori, belge veya neden"),
    column.accessor("createdAt", {
      id: "zaman",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Zaman" />,
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>,
      meta: { label: "Zaman" },
    }),
    column.accessor((m) => movementTypeLabels[m.type], {
      id: "tur",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tür" />,
      cell: ({ row }) => (
        <>
          <MovementTypeBadge type={row.original.type} />
          {row.original.reversesId && <span className="text-muted-foreground"> (ters kayıt)</span>}
        </>
      ),
      enableColumnFilter: true,
      meta: { label: "Tür", variant: "multiSelect", options: options(movements.map((m) => movementTypeLabels[m.type])) },
    }),
    column.accessor("productName", {
      id: "urun",
      size: 180,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Ürün" />,
      cell: ({ row }) => (
        <div className="flex flex-col whitespace-normal">
          <Link href={`/urunler/${row.original.productId}`} className="font-medium underline-offset-4 hover:underline">
            {row.original.productName}
          </Link>
          <span className="text-muted-foreground font-mono text-xs">{row.original.productCode}</span>
        </div>
      ),
      meta: { label: "Ürün" },
    }),
    column.accessor("productCategory", {
      id: "kategori",
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kategori" />,
      cell: ({ row }) => <CategoryBadge category={row.original.productCategory} />,
      enableColumnFilter: true,
      meta: { label: "Kategori", variant: "multiSelect", options: options(movements.map((m) => m.productCategory)) },
    }),
    column.accessor((m) => m.lokasyonName ?? "Yolda", {
      id: "lokasyon",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Lokasyon" />,
      cell: ({ cell }) => <div className="whitespace-normal">{cell.getValue()}</div>,
      enableColumnFilter: true,
      meta: { label: "Lokasyon", variant: "multiSelect", options: options(movements.map((m) => m.lokasyonName ?? "Yolda")) },
    }),
    column.accessor((m) => Number(m.quantity), {
      id: "miktar",
      size: 90,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Miktar" className="ml-auto" />,
      cell: ({ row }) => (
        <div className={cn("text-right font-medium tabular-nums", Number(row.original.quantity) < 0 ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400")}>
          {displayQuantity(row.original.quantity)} {unitLabels[row.original.unit]}
        </div>
      ),
      meta: { label: "Miktar" },
    }),
    ...(values
      ? [
          column.accessor((m) => values[m.id] ?? 0, {
            id: "tutar",
            size: 80,
            header: ({ column }) => <DataTableColumnHeader column={column} label="Tutar" className="ml-auto" />,
            cell: ({ row }) => {
              const value = values[row.original.id];
              return <div className="text-right tabular-nums">{value === null || value === undefined ? "—" : tl(value)}</div>;
            },
            meta: { label: "Tutar" },
          }),
        ]
      : []),
    column.accessor("userName", {
      id: "kullanici",
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kullanıcı" />,
      cell: ({ cell }) => <div className="whitespace-normal">{cell.getValue()}</div>,
      enableColumnFilter: true,
      meta: { label: "Kullanıcı", variant: "multiSelect", options: options(movements.map((m) => m.userName)) },
    }),
    column.accessor((m) => document(m), {
      id: "belge",
      size: 220,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Belge / neden" />,
      cell: ({ cell }) => <div className="whitespace-normal">{cell.getValue()}</div>,
      enableSorting: false,
      meta: { label: "Belge / neden" },
    }),
    ...(canReverse
      ? [
          column.display({
            id: "ters",
            size: 70,
            header: () => null,
            cell: ({ row }) =>
              !row.original.reversesId &&
              !reversed.has(row.original.id) && <ReverseButton action={reverseMovementAction.bind(null, row.original.id)} />,
            enableHiding: false,
          }),
        ]
      : []),
  ]);

  const { table } = useClientDataTable({ data: movements, columns, sorting: [{ id: "zaman", desc: true }] });

  return (
    <DataTable table={table} aria-label="Stok hareketleri">
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
