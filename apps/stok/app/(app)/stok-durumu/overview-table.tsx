"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Subscribe, type ReactTable } from "@tanstack/react-table";
import { Button } from "@artek/ui/components/button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor, hiddenSearch, searchColumn } from "@/components/data-table/columns";
import { useDataTable } from "@/hooks/use-data-table";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { displayQuantity } from "@/lib/labels";
import type { Overview } from "@/lib/overview";
import { addQuantities, unitLabels, type Unit } from "@/lib/quantity";

type Row = Overview["rows"][number];
const column = columnHelperFor<Row>();
const pileFields = [
  ["physical", "Fiziksel"],
  ["reserved", "Ayrılmış"],
  ["available", "Kullanılabilir"],
] as const;

function Quantity({ value, strong }: { value: string; strong?: boolean }) {
  return <div className={`text-right tabular-nums ${strong ? "font-medium" : ""}`}>{displayQuantity(value)}</div>;
}

export function OverviewTable({ overview, categories }: { overview: Overview; categories: string[] }) {
  const columns = column.columns([
    searchColumn<Row>((r) => `${r.code} ${r.name}`, "Ürün kodu veya adı"),
    column.accessor("code", {
      id: "urun",
      size: 360,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Ürün" />,
      cell: ({ row }) => (
        <span>
          <Link href={`/urunler/${row.original.id}`} className="font-mono underline-offset-4 hover:underline">
            {row.original.code}
          </Link>{" "}
          {row.original.name} <span className="text-muted-foreground text-xs">{unitLabels[row.original.unit]}</span>
        </span>
      ),
      enableHiding: false,
    }),
    column.accessor("category", {
      id: "kategori",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kategori" />,
      enableColumnFilter: true,
      meta: { label: "Kategori", variant: "multiSelect", options: categories.map((c) => ({ label: c, value: c })) },
    }),
    ...overview.lokasyon.map((l) =>
      column.group({
        id: `lokasyon-${l.id}`,
        header: () => <div className="text-center">{l.name}</div>,
        columns: column.columns(
          pileFields.map(([field, label]) =>
          column.accessor((r) => Number(r.stock[l.id][field]), {
            id: `${l.id}-${field}`,
            header: ({ column }) => <DataTableColumnHeader column={column} label={label} className="ml-auto" />,
            cell: ({ row }) => <Quantity value={row.original.stock[l.id][field]} />,
            meta: { label: `${l.name} · ${label}` },
          }),
          ),
        ),
      }),
    ),
    column.accessor((r) => Number(r.inTransit), {
      id: "yolda",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Yolda" className="ml-auto" />,
      cell: ({ row }) => <Quantity value={row.original.inTransit} />,
      meta: { label: "Yolda" },
    }),
    column.accessor((r) => Number(r.total), {
      id: "toplam",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Toplam" className="ml-auto" />,
      cell: ({ row }) => <Quantity value={row.original.total} strong />,
      meta: { label: "Toplam" },
    }),
  ]);

  const { table } = useDataTable({
    mode: "client",
    // Keep the page from the URL; the hook itself goes back to page 1 when filters change.
    autoResetPageIndex: false,
    data: overview.rows,
    columns,
    initialState: { ...hiddenSearch, pagination: { pageIndex: 0, pageSize: 50 } },
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col gap-3">
      <DataTable table={table} aria-label="Stok durumu">
        <DataTableToolbar table={table}>
          <CsvLink table={table} />
        </DataTableToolbar>
      </DataTable>
      <Totals table={table} lokasyon={overview.lokasyon} />
    </div>
  );
}

type Filter = { id: string; value: unknown };

// The CSV has the same rows as the table: its search and categories, plus the server filters in the URL.
function CsvLink({ table }: { table: ReactTable<DataTableFeatures, Row, unknown> }) {
  const searchParams = useSearchParams();
  return (
    <Subscribe source={table.atoms.columnFilters} selector={(filters) => filters as Filter[]}>
      {(filters) => {
        const query = new URLSearchParams();
        for (const key of ["lokasyon", "kritik"]) {
          const value = searchParams.get(key);
          if (value) query.set(key, value);
        }
        const search = filters.find((f) => f.id === "ara")?.value;
        if (typeof search === "string" && search.trim()) query.set("q", search.trim());
        const categories = filters.find((f) => f.id === "kategori")?.value;
        for (const c of Array.isArray(categories) ? categories : []) query.append("kategori", String(c));
        return (
          <Button asChild variant="outline">
            <a href={`/stok-durumu/csv${query.size ? `?${query}` : ""}`}>CSV indir</a>
          </Button>
        );
      }}
    </Subscribe>
  );
}

// Adet and kg can't be added together, so the shown rows are totalled per unit.
function Totals({
  table,
  lokasyon,
}: {
  table: ReactTable<DataTableFeatures, Row, unknown>;
  lokasyon: Overview["lokasyon"];
}) {
  return (
    <Subscribe source={table.atoms.columnFilters} selector={(filters) => filters}>
      {() => {
        const rows = table.getFilteredRowModel().rows.map((r) => r.original);
        const units = [...new Set(rows.map((r) => r.unit))];
        return (
          <div className="text-muted-foreground flex flex-col gap-1 text-sm">
            {units.map((unit) => {
              const lines = rows.filter((r) => r.unit === unit);
              const sum = (pick: (r: Row) => string) => displayQuantity(addQuantities(...lines.map(pick)));
              return (
                <p key={unit}>
                  <span className="text-foreground font-medium">Toplam ({unitLabels[unit as Unit]}):</span>{" "}
                  {lokasyon.map((l) => `${l.name} ${sum((r) => r.stock[l.id].physical)}`).join(" · ")} · Yolda {sum((r) => r.inTransit)} ·{" "}
                  <span className="text-foreground">Toplam {sum((r) => r.total)}</span>
                </p>
              );
            })}
            <p>
              {rows.length} ürün. Yolda: transferde olup henüz teslim alınmamış miktar; hiçbir Lokasyonda sayılmaz.
            </p>
          </div>
        );
      }}
    </Subscribe>
  );
}
