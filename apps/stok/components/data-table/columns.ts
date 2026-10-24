import { createColumnHelper, type RowData, type SortingState } from "@tanstack/react-table";
import { useDataTable, type UseDataTableProps } from "@/hooks/use-data-table";
import type { DataTableFeatures } from "@/lib/data-table-features";

export function columnHelperFor<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

// Hidden column joining fields for one toolbar search, lowercased Turkish-style ("delikli" finds "DELİKLİ").
export function searchColumn<TData extends RowData>(text: (row: TData) => string, placeholder: string) {
  return columnHelperFor<TData>().accessor((row) => text(row).toLocaleLowerCase("tr-TR"), {
    id: "ara",
    header: () => null,
    cell: () => null,
    enableHiding: false,
    enableSorting: false,
    enableColumnFilter: true,
    meta: { label: "Ara", placeholder, variant: "text" },
  });
}

export const option = (value: string) => ({ label: value, value });

export const options = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "tr")).map(option);

// A tablecn table over rows the server already loaded; filters, sort and page live in the URL.
export function useClientDataTable<TData extends { id: string }>({
  data,
  columns,
  pageSize = 20,
  sorting,
  hidden = [],
}: {
  data: TData[];
  columns: UseDataTableProps<TData>["columns"];
  pageSize?: number;
  sorting?: SortingState;
  hidden?: string[];
}) {
  const hide = [...(columns.some((c) => c.id === "ara") ? ["ara"] : []), ...hidden];
  return useDataTable({
    mode: "client",
    autoResetPageIndex: false, // the URL owns the page; the hook resets it when filters change
    data,
    columns,
    initialState: {
      columnVisibility: Object.fromEntries(hide.map((id) => [id, false])),
      sorting,
      pagination: { pageIndex: 0, pageSize },
    },
    getRowId: (row) => row.id,
  });
}
