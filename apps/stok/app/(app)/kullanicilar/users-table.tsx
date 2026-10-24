"use client";

import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor, hiddenSearch, searchColumn } from "@/components/data-table/columns";
import { useDataTable } from "@/hooks/use-data-table";
import { roleLabels } from "@/lib/labels";
import type { Role } from "@/lib/permissions";
import { UserStatus } from "./access-fields";

type User = { id: string; name: string; email: string; roles: Role[]; lokasyonIds: string[]; active: boolean; invited: boolean };
const column = columnHelperFor<User>();
const statusLabel = (u: User) => (!u.active ? "Devre dışı" : u.invited ? "Davet bekliyor" : "Etkin");

export function UsersTable({ users, lokasyon }: { users: User[]; lokasyon: { id: string; name: string }[] }) {
  const lokasyonName = Object.fromEntries(lokasyon.map((l) => [l.id, l.name]));

  const columns = column.columns([
    searchColumn<User>((u) => `${u.name} ${u.email}`, "Ad veya e-posta"),
    column.accessor("name", {
      id: "ad",
      size: 200,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Ad soyad" />,
      cell: ({ row }) => (
        <Link href={`/kullanicilar/${row.original.id}`} className="underline-offset-4 hover:underline">
          {row.original.name}
        </Link>
      ),
      enableHiding: false,
    }),
    column.accessor("email", {
      id: "eposta",
      size: 260,
      header: ({ column }) => <DataTableColumnHeader column={column} label="E-posta" />,
      meta: { label: "E-posta" },
    }),
    column.accessor((u) => u.roles.map((r) => roleLabels[r]), {
      id: "roller",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Roller" />,
      cell: ({ row }) => row.original.roles.map((r) => roleLabels[r]).join(", "),
      enableSorting: false,
      enableColumnFilter: true,
      meta: { label: "Roller", variant: "multiSelect", options: Object.values(roleLabels).map((v) => ({ label: v, value: v })) },
    }),
    column.accessor((u) => u.lokasyonIds.map((id) => lokasyonName[id]), {
      id: "lokasyon",
      size: 260,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Lokasyon" />,
      cell: ({ row }) => row.original.lokasyonIds.map((id) => lokasyonName[id]).join(", ") || "—",
      enableSorting: false,
      enableColumnFilter: true,
      meta: { label: "Lokasyon", variant: "multiSelect", options: lokasyon.map((l) => ({ label: l.name, value: l.name })) },
    }),
    column.accessor((u) => statusLabel(u), {
      id: "durum",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Durum" />,
      cell: ({ row }) => <UserStatus active={row.original.active} invited={row.original.invited} />,
      enableColumnFilter: true,
      meta: {
        label: "Durum",
        variant: "multiSelect",
        options: ["Etkin", "Davet bekliyor", "Devre dışı"].map((v) => ({ label: v, value: v })),
      },
    }),
  ]);

  const { table } = useDataTable({
    mode: "client",
    // Keep the page from the URL; the hook itself goes back to page 1 when filters change.
    autoResetPageIndex: false,
    data: users,
    columns,
    initialState: { ...hiddenSearch, pagination: { pageIndex: 0, pageSize: 20 } },
    getRowId: (row) => row.id,
  });

  return (
    <DataTable table={table} aria-label="Kullanıcılar">
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
