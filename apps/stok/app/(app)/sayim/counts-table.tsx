"use client";

import Link from "next/link";
import { Badge } from "@artek/ui/components/badge";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor, option, options, useClientDataTable } from "@/components/data-table/columns";
import type { listCounts } from "@/lib/counts";
import { countKindLabels, countStatusLabels, formatDateTime } from "@/lib/labels";

type Count = Awaited<ReturnType<typeof listCounts>>[number];
const column = columnHelperFor<Count>();

export function CountsTable({ counts }: { counts: Count[] }) {
  const columns = column.columns([
    column.accessor("createdAt", {
      id: "acilis",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Açılış" />,
      cell: ({ row }) => (
        <Link href={`/sayim/${row.original.id}`} className="underline-offset-4 hover:underline">
          {formatDateTime(row.original.createdAt)}
        </Link>
      ),
      enableHiding: false,
    }),
    column.accessor((c) => countKindLabels[c.kind], {
      id: "tur",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tür" />,
      enableColumnFilter: true,
      meta: { label: "Tür", variant: "multiSelect", options: Object.values(countKindLabels).map(option) },
    }),
    column.accessor("lokasyonName", {
      id: "lokasyon",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Lokasyon" />,
      enableColumnFilter: true,
      meta: { label: "Lokasyon", variant: "multiSelect", options: options(counts.map((c) => c.lokasyonName)) },
    }),
    column.accessor((c) => c.category ?? "Tüm ürünler", {
      id: "kapsam",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kapsam" />,
      meta: { label: "Kapsam" },
    }),
    column.accessor((c) => countStatusLabels[c.status], {
      id: "durum",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Durum" />,
      cell: ({ row }) => (
        <Badge variant={row.original.status === "taslak" ? "default" : "secondary"}>{countStatusLabels[row.original.status]}</Badge>
      ),
      enableColumnFilter: true,
      meta: { label: "Durum", variant: "multiSelect", options: Object.values(countStatusLabels).map(option) },
    }),
    column.accessor("createdBy", {
      id: "acan",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Açan" />,
      meta: { label: "Açan" },
    }),
  ]);

  const { table } = useClientDataTable({ data: counts, columns });

  return (
    <DataTable table={table} aria-label="Sayımlar">
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
