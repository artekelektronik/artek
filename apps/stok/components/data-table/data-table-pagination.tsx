// Vendored from tablecn (https://github.com/sadmann7/tablecn, MIT), Radix build.
"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { ReactTable, RowData } from "@tanstack/react-table";

import { cn } from "@artek/ui/lib/utils";
import * as React from "react";

import type { DataTableFeatures } from "@/lib/data-table-features";

import { getVisibleSelectedRows } from "@/lib/data-table-utils";
import { Button } from "@artek/ui/components/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@artek/ui/components/select";

interface DataTablePaginationProps<
  TData extends RowData,
> extends React.ComponentProps<"div"> {
  table: ReactTable<DataTableFeatures, TData, unknown>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData extends RowData>({
  table,
  pageSizeOptions = [10, 20, 50, 100],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  return (
    <table.Subscribe
      selector={(state) => ({
        pageIndex: state.pagination.pageIndex,
        pageSize: state.pagination.pageSize,
        selectedRowCount: table.getSelectedRowIds().length,
        visibleSelectedRowCount: getVisibleSelectedRows(table).length,
        rowCount: table.getRowCount(),
      })}
    >
      {({ pageIndex, pageSize, selectedRowCount, visibleSelectedRowCount, rowCount }) => (
        <DataTablePaginationContent
          table={table}
          pageIndex={pageIndex}
          pageSize={pageSize}
          rowCount={rowCount}
          selectedRowCount={selectedRowCount}
          visibleSelectedRowCount={visibleSelectedRowCount}
          pageSizeOptions={pageSizeOptions}
          className={className}
          {...props}
        />
      )}
    </table.Subscribe>
  );
}

interface DataTablePaginationContentProps<
  TData extends RowData,
> extends React.ComponentProps<"div"> {
  table: ReactTable<DataTableFeatures, TData, unknown>;
  pageIndex: number;
  pageSize: number;
  rowCount: number;
  selectedRowCount: number;
  visibleSelectedRowCount: number;
  pageSizeOptions: number[];
}

function DataTablePaginationContent<TData extends RowData>({
  table,
  pageIndex,
  pageSize,
  rowCount,
  selectedRowCount,
  visibleSelectedRowCount,
  pageSizeOptions,
  className,
  ...props
}: DataTablePaginationContentProps<TData>) {
  const pageSizeLabelId = React.useId();
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  return (
    <div
      data-slot="data-table-pagination"
      className={cn(
        "flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8",
        className,
      )}
      {...props}
    >
      <div
        role="status"
        className="flex-1 text-sm whitespace-nowrap text-muted-foreground"
      >
        {selectedRowCount > 0 ? (
          <>
            {selectedRowCount} satır seçili
            {selectedRowCount > visibleSelectedRowCount
              ? ` (${selectedRowCount - visibleSelectedRowCount} tanesi gösterilmiyor)`
              : ""}
            .
          </>
        ) : rowCount > 0 ? (
          `${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, rowCount)} / ${rowCount} kayıt`
        ) : (
          "0 kayıt"
        )}
      </div>
      <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p
            id={pageSizeLabelId}
            className="text-sm font-medium whitespace-nowrap"
          >
            Sayfa başına satır
          </p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger aria-labelledby={pageSizeLabelId} className="w-18">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div
          role="status"
          className="flex items-center justify-center text-sm font-medium"
        >
          Sayfa {pageIndex + 1} / {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <Button
            aria-label="İlk sayfa"
            variant="outline"
            size="icon"
            className="hidden lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!canPreviousPage}
          >
            <ChevronsLeft
              className="rtl:rotate-180"
            />
          </Button>
          <Button
            aria-label="Önceki sayfa"
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!canPreviousPage}
          >
            <ChevronLeft
              className="rtl:rotate-180"
            />
          </Button>
          <Button
            aria-label="Sonraki sayfa"
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!canNextPage}
          >
            <ChevronRight
              className="rtl:rotate-180"
            />
          </Button>
          <Button
            aria-label="Son sayfa"
            variant="outline"
            size="icon"
            className="hidden lg:flex"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!canNextPage}
          >
            <ChevronsRight
              className="rtl:rotate-180"
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
