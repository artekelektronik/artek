"use client";

import Link from "next/link";
import { Badge } from "@artek/ui/components/badge";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor, hiddenSearch, searchColumn } from "@/components/data-table/columns";
import { ProductImage } from "@/components/product-image";
import { useDataTable } from "@/hooks/use-data-table";
import { unitLabels, type Unit } from "@/lib/quantity";

export type ProductRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  manufacturerCode: string | null;
  isTradeGoods: boolean;
  isMaterial: boolean;
  unit: Unit;
  showOnSite: boolean;
  image: string | null;
};

const column = columnHelperFor<ProductRow>();

const types = (p: ProductRow) => [p.isTradeGoods && "Ticari mal", p.isMaterial && "Malzeme"].filter(Boolean) as string[];

export function ProductsTable({ rows, categories }: { rows: ProductRow[]; categories: string[] }) {
  const columns = column.columns([
    searchColumn<ProductRow>((p) => [p.code, p.name, p.manufacturerCode].filter(Boolean).join(" "), "Kod, ad veya üretici kodu"),
    column.display({
      id: "gorsel",
      size: 64,
      header: () => <span className="sr-only">Görsel</span>,
      cell: ({ row }) => <ProductImage path={row.original.image} alt={row.original.name} className="size-10" />,
      enableHiding: true,
      meta: { label: "Görsel" },
    }),
    column.accessor("code", {
      id: "kod",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kod" />,
      cell: ({ row }) => (
        <Link href={`/urunler/${row.original.id}`} className="font-mono underline-offset-4 hover:underline">
          {row.original.code}
        </Link>
      ),
      enableHiding: false,
    }),
    column.accessor("name", {
      id: "ad",
      size: 320,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Ad" />,
      meta: { label: "Ad" },
    }),
    column.accessor("category", {
      id: "kategori",
      size: 180,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kategori" />,
      enableColumnFilter: true,
      meta: { label: "Kategori", variant: "multiSelect", options: categories.map((c) => ({ label: c, value: c })) },
    }),
    column.accessor((p) => types(p), {
      id: "tur",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tür" />,
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.isTradeGoods && <Badge variant="secondary">Ticari mal</Badge>}
          {row.original.isMaterial && <Badge variant="outline">Malzeme</Badge>}
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: "Tür",
        variant: "multiSelect",
        options: [
          { label: "Ticari mal", value: "Ticari mal" },
          { label: "Malzeme", value: "Malzeme" },
        ],
      },
    }),
    column.accessor("unit", {
      id: "birim",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Birim" />,
      cell: ({ row }) => unitLabels[row.original.unit],
      meta: { label: "Birim" },
    }),
    column.accessor((p) => (p.showOnSite ? "evet" : "hayir"), {
      id: "sitede",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Sitede" />,
      cell: ({ row }) => (row.original.showOnSite ? "Evet" : "Hayır"),
      enableColumnFilter: true,
      meta: {
        label: "Sitede",
        variant: "select",
        options: [
          { label: "Evet", value: "evet" },
          { label: "Hayır", value: "hayir" },
        ],
      },
    }),
  ]);

  const { table } = useDataTable({
    mode: "client",
    // Keep the page from the URL; the hook itself goes back to page 1 when filters change.
    autoResetPageIndex: false,
    data: rows,
    columns,
    initialState: { ...hiddenSearch, pagination: { pageIndex: 0, pageSize: 20 } },
    getRowId: (row) => row.id,
  });

  return (
    <DataTable table={table} aria-label="Ürünler">
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
