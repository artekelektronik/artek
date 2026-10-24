"use client";

import Link from "next/link";
import { Badge } from "@artek/ui/components/badge";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor } from "@/components/data-table/columns";
import { useDataTable } from "@/hooks/use-data-table";
import { formatDateTime } from "@/lib/labels";
import type { listTransfers } from "@/lib/transfers";

type Transfer = Awaited<ReturnType<typeof listTransfers>>[number];
const column = columnHelperFor<Transfer>();
const options = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "tr")).map((v) => ({ label: v, value: v }));
const statusLabel = (t: Transfer) => (t.status === "yolda" ? "Yolda" : "Teslim alındı");

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
    column.accessor((t) => statusLabel(t), {
      id: "durum",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Durum" />,
      cell: ({ row }) =>
        row.original.status === "yolda" ? <Badge>Yolda</Badge> : <Badge variant="secondary">Teslim alındı</Badge>,
      enableColumnFilter: true,
      meta: {
        label: "Durum",
        variant: "multiSelect",
        options: [
          { label: "Yolda", value: "Yolda" },
          { label: "Teslim alındı", value: "Teslim alındı" },
        ],
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

  const { table } = useDataTable({
    mode: "client",
    data: transfers,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: 20 } },
    getRowId: (row) => row.id,
  });

  return (
    <DataTable table={table} aria-label="Transferler">
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
