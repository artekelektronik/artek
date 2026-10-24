"use client";

import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor, option, options, useClientDataTable } from "@/components/data-table/columns";
import { formatDateTime, transferStatusLabels } from "@/lib/labels";
import type { listTransfers } from "@/lib/transfers";
import { TransferStatusBadge } from "./transfer-status";

type Transfer = Awaited<ReturnType<typeof listTransfers>>[number];
const column = columnHelperFor<Transfer>();

export function TransfersTable({ transfers }: { transfers: Transfer[] }) {
  const columns = column.columns([
    column.accessor("sentAt", {
      id: "sevk",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Sevk" />,
      cell: ({ row }) => (
        <Link href={`/transfer/${row.original.id}`} className="underline-offset-4 hover:underline">
          {formatDateTime(row.original.sentAt)}
        </Link>
      ),
      enableHiding: false,
    }),
    column.accessor("fromName", {
      id: "kaynak",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kaynak" />,
      enableColumnFilter: true,
      meta: { label: "Kaynak", variant: "multiSelect", options: options(transfers.map((t) => t.fromName)) },
    }),
    column.accessor("toName", {
      id: "hedef",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Hedef" />,
      enableColumnFilter: true,
      meta: { label: "Hedef", variant: "multiSelect", options: options(transfers.map((t) => t.toName)) },
    }),
    column.accessor((t) => transferStatusLabels[t.status], {
      id: "durum",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Durum" />,
      cell: ({ row }) => <TransferStatusBadge status={row.original.status} />,
      enableColumnFilter: true,
      meta: {
        label: "Durum",
        variant: "multiSelect",
        options: Object.values(transferStatusLabels).map(option),
      },
    }),
    column.accessor("sentBy", {
      id: "sevkEden",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Sevk eden" />,
      meta: { label: "Sevk eden" },
    }),
    column.accessor((t) => t.receivedBy ?? "", {
      id: "teslimAlan",
      size: 240,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Teslim alan" />,
      cell: ({ row }) =>
        row.original.receivedBy ? `${row.original.receivedBy} · ${formatDateTime(row.original.receivedAt!)}` : "",
      meta: { label: "Teslim alan" },
    }),
  ]);

  const { table } = useClientDataTable({ data: transfers, columns });

  return (
    <DataTable table={table} aria-label="Transferler">
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
