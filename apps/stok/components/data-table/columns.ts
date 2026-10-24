import { createColumnHelper, type RowData } from "@tanstack/react-table";
import type { DataTableFeatures } from "@/lib/data-table-features";

export function columnHelperFor<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

// One search box over several fields: a hidden column whose value joins them, filtered as text.
// Hidden columns keep their filter in the toolbar, and it can't be shown as a column. The text is
// lowercased the Turkish way, so "delikli" finds "DELİKLİ".
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

// Start with the search column hidden.
export const hiddenSearch = { columnVisibility: { ara: false } };
