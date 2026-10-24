"use client";

import { Badge } from "@artek/ui/components/badge";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor, hiddenSearch, searchColumn } from "@/components/data-table/columns";
import { useDataTable } from "@/hooks/use-data-table";
import { formatDateTime } from "@/lib/labels";

export type NotificationRow = {
  id: string;
  createdAt: Date;
  subject: string;
  recipients: string[];
  status: "pending" | "sent" | "failed";
  statusLabel: string;
  sentAt: Date | null;
  attempts: number;
  lastError: string | null;
};

const column = columnHelperFor<NotificationRow>();

export function NotificationsTable({ notifications }: { notifications: NotificationRow[] }) {
  const statuses = [...new Set(notifications.map((n) => n.statusLabel))];

  const columns = column.columns([
    searchColumn<NotificationRow>((n) => `${n.subject} ${n.recipients.join(" ")}`, "Konu veya alıcı"),
    column.accessor("createdAt", {
      id: "olusma",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Oluşma" />,
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>,
      enableHiding: false,
    }),
    column.accessor("subject", {
      id: "konu",
      size: 320,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Konu" />,
      meta: { label: "Konu" },
    }),
    column.accessor((n) => n.recipients.join(", "), {
      id: "alicilar",
      size: 240,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Alıcılar" />,
      cell: ({ cell }) => <div className="max-w-56 truncate text-sm">{cell.getValue()}</div>,
      enableSorting: false,
      meta: { label: "Alıcılar" },
    }),
    column.accessor("statusLabel", {
      id: "durum",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Durum" />,
      cell: ({ row }) => (
        <>
          <Badge variant={row.original.status === "sent" ? "secondary" : row.original.status === "failed" ? "destructive" : "default"}>
            {row.original.statusLabel}
          </Badge>
          {row.original.sentAt && <span className="text-muted-foreground ml-2 text-xs">{formatDateTime(row.original.sentAt)}</span>}
        </>
      ),
      enableColumnFilter: true,
      meta: { label: "Durum", variant: "multiSelect", options: statuses.map((s) => ({ label: s, value: s })) },
    }),
    column.accessor("attempts", {
      id: "deneme",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Deneme" className="ml-auto" />,
      cell: ({ cell }) => <div className="text-right tabular-nums">{cell.getValue()}</div>,
      meta: { label: "Deneme" },
    }),
    column.accessor((n) => n.lastError ?? "", {
      id: "hata",
      size: 280,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Son hata" />,
      cell: ({ cell }) => <div className="text-destructive max-w-64 truncate text-sm">{cell.getValue()}</div>,
      enableSorting: false,
      meta: { label: "Son hata" },
    }),
  ]);

  const { table } = useDataTable({
    mode: "client",
    data: notifications,
    columns,
    initialState: { ...hiddenSearch, pagination: { pageIndex: 0, pageSize: 20 } },
    getRowId: (row) => row.id,
  });

  return (
    <DataTable table={table} aria-label="Bildirimler">
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
