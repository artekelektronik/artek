// Vendored from tablecn (https://github.com/sadmann7/tablecn, MIT), Radix build.
"use client";

import { X } from "lucide-react";
import {
  type Column,
  type ReactTable,
  type RowData,
  Subscribe,
} from "@tanstack/react-table";
import { cn } from "@artek/ui/lib/utils";
import * as React from "react";

import type { DataTableFeatures } from "@/lib/data-table-features";

import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DataTableSliderFilter } from "@/components/data-table/data-table-slider-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { SortBar, type SortKind } from "@/components/sort-bar";

interface DataTableToolbarProps<
  TData extends RowData,
> extends React.ComponentProps<"div"> {
  table: ReactTable<DataTableFeatures, TData, unknown>;
}

export function DataTableToolbar<TData extends RowData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );

  // Columns with a label; what kind each is comes from its first value.
  const sortFields = table
    .getAllLeafColumns()
    .filter((column) => column.getCanSort() && column.columnDef.meta?.label)
    .map((column) => {
      const value: unknown = table.getCoreRowModel().rows[0]?.getValue(column.id);
      const kind: SortKind = typeof value === "number" ? "number" : value instanceof Date ? "date" : "text";
      return { id: column.id, label: column.columnDef.meta!.label!, kind };
    });

  function onReset() {
    table.resetColumnFilters(true);
    table.resetJoinOperator(true);
  }

  // Left: filters. Right: sort, columns, extras.
  return (
    <div
      data-slot="data-table-toolbar"
      className={cn(
        "flex w-full shrink-0 flex-wrap items-center justify-between gap-2",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        <Subscribe
          source={table.atoms.columnFilters}
          selector={(filters) => filters.length > 0}
        >
          {(isFiltered) =>
            isFiltered && (
              <Button
                aria-label="Filtreleri sıfırla"
                variant="ghost"
                onClick={onReset}
              >
                <X
                />
                Sıfırla
              </Button>
            )
          }
        </Subscribe>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Subscribe source={table.atoms.sorting} selector={(sorting) => sorting}>
          {(sorting) => <SortBar fields={sortFields} sorts={sorting} onChange={(next) => table.setSorting(next)} />}
        </Subscribe>
        {children}
        <DataTableViewOptions table={table} align="end" />
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData extends RowData> {
  column: Column<DataTableFeatures, TData>;
}

function DataTableToolbarFilter<TData extends RowData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;
  if (!columnMeta?.variant) return null;

  const title = columnMeta.label ?? column.id;
  const placeholder = columnMeta.placeholder ?? columnMeta.label;

  switch (columnMeta.variant) {
    case "text":
      return (
        <DataTableFilterInput
          column={column}
          placeholder={placeholder}
          className="w-40 lg:w-56"
        />
      );

    case "number":
      return (
        <div className="relative">
          <DataTableFilterInput
            column={column}
            type="number"
            inputMode="numeric"
            placeholder={placeholder}
            className={cn("w-30", columnMeta.unit && "pe-8")}
          />
          {columnMeta.unit && (
            <span className="absolute inset-e-0 top-0 bottom-0 flex items-center rounded-e-md bg-accent px-2 text-sm text-muted-foreground">
              {columnMeta.unit}
            </span>
          )}
        </div>
      );

    case "range":
      return <DataTableSliderFilter column={column} title={title} />;

    case "date":
    case "dateRange":
      return (
        <DataTableDateFilter
          column={column}
          title={title}
          multiple={columnMeta.variant === "dateRange"}
        />
      );

    case "select":
    case "multiSelect":
      return (
        <DataTableFacetedFilter
          column={column}
          title={title}
          options={columnMeta.options ?? []}
          multiple={columnMeta.variant === "multiSelect"}
        />
      );

    default:
      return null;
  }
}

function readFilterInputValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.join(",");
  }

  return "";
}

interface DataTableFilterInputProps<
  TData extends RowData,
> extends React.ComponentProps<"input"> {
  column: Column<DataTableFeatures, TData>;
}

function DataTableFilterInput<TData extends RowData>({
  column,
  type = "text",
  ...props
}: DataTableFilterInputProps<TData>) {
  return (
    <Subscribe
      source={column.table.atoms.columnFilters}
      selector={() => column.getFilterValue()}
    >
      {(filterValue) => (
        <Input
          type={type}
          {...props}
          value={readFilterInputValue(filterValue)}
          onChange={(event) =>
            column.setFilterValue(event.target.value || undefined)
          }
        />
      )}
    </Subscribe>
  );
}
