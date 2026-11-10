"use client";

import { Subscribe, type ReactTable, type RowData } from "@tanstack/react-table";
import type { DataTableFeatures } from "@/lib/data-table-features";

// Renders `children` with the rows left after search and filters, again whenever they change.
export function FilteredRows<TData extends RowData>({ table, children }: { table: ReactTable<DataTableFeatures, TData, unknown>; children: (rows: TData[]) => React.ReactNode }) {
  return (
    <Subscribe source={table.atoms.columnFilters} selector={(filters) => filters}>
      {() => children(table.getFilteredRowModel().rows.map((r) => r.original))}
    </Subscribe>
  );
}
