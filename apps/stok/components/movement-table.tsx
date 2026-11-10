"use client";

import { useState } from "react";
import Link from "next/link";
import { Label } from "@artek/ui/components/label";
import { Switch } from "@artek/ui/components/switch";
import { cn } from "@artek/ui/lib/utils";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { FilteredRows } from "@/components/data-table/filtered-rows";
import { columnHelperFor, options, searchColumn, useClientDataTable } from "@/components/data-table/columns";
import { reverseMovementAction } from "@/app/(app)/hareketler/actions";
import type { listMovements } from "@/lib/ledger";
import type { MovementPrice } from "@/lib/stock-out-report";
import { tl, usd } from "@/lib/finance-calc";
import { displayQuantity, formatDateTime, movementTypeLabels } from "@/lib/labels";
import { addQuantities, unitLabels } from "@/lib/quantity";
import { ReverseButton } from "./reverse-button";
import { StockOutRowActions } from "./stock-out-row-actions";
import { CategoryBadge, MovementTypeBadge } from "./stock-badges";

type Movement = Awaited<ReturnType<typeof listMovements>>[number];

const column = columnHelperFor<Movement>();
const document = (m: Movement) => [m.supplier, m.reference, m.reason].filter(Boolean).join(" · ");

// `values` is passed only to a Finans paneli holder; without it there are no price columns.
// `forProduct`: every row is the same Ürün, so its Ürün and Kategori columns are left out.
// `correctable` (Stok çıkışı): rows get Düzenle / Sil, and corrected pairs are hidden until asked for.
export function MovementTable({
  movements,
  canReverse,
  values,
  forProduct = false,
  correctable = false,
}: {
  movements: Movement[];
  canReverse: boolean;
  values?: Record<string, MovementPrice>;
  forProduct?: boolean;
  correctable?: boolean;
}) {
  const reversed = new Set(movements.map((m) => m.reversesId).filter(Boolean));
  const [showCorrected, setShowCorrected] = useState(false);
  const corrected = (m: Movement) => !!m.reversesId || reversed.has(m.id);
  const rows = correctable && !showCorrected ? movements.filter((m) => !corrected(m)) : movements;

  const columns = column.columns([
    searchColumn<Movement>((m) => [m.productCode, m.productName, m.productCategory, document(m), m.userName].join(" "), forProduct ? "Belge, neden veya kullanıcı" : "Ürün, kategori, belge veya neden"),
    column.accessor("createdAt", {
      id: "zaman",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Zaman" />,
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>,
      meta: { label: "Zaman" },
    }),
    column.accessor((m) => movementTypeLabels[m.type], {
      id: "tur",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tür" />,
      cell: ({ row }) => (
        <>
          <MovementTypeBadge type={row.original.type} />
          {row.original.reversesId && <span className="text-muted-foreground"> (ters kayıt)</span>}
        </>
      ),
      enableColumnFilter: true,
      meta: { label: "Tür", variant: "multiSelect", options: options(movements.map((m) => movementTypeLabels[m.type])) },
    }),
    ...(forProduct
      ? []
      : [
          column.accessor("productName", {
            id: "urun",
            size: 180,
            header: ({ column }) => <DataTableColumnHeader column={column} label="Ürün" />,
            cell: ({ row }) => (
              <div className="flex flex-col whitespace-normal">
                <Link href={`/urunler/${row.original.productId}`} className="font-medium underline-offset-4 hover:underline">
                  {row.original.productName}
                </Link>
                <span className="text-muted-foreground font-mono text-xs">{row.original.productCode}</span>
              </div>
            ),
            meta: { label: "Ürün" },
          }),
          column.accessor("productCategory", {
            id: "kategori",
            size: 100,
            header: ({ column }) => <DataTableColumnHeader column={column} label="Kategori" />,
            cell: ({ row }) => <CategoryBadge category={row.original.productCategory} />,
            enableColumnFilter: true,
            meta: { label: "Kategori", variant: "multiSelect", options: options(movements.map((m) => m.productCategory)) },
          }),
        ]),
    column.accessor((m) => m.lokasyonName ?? "Yolda", {
      id: "lokasyon",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Lokasyon" />,
      cell: ({ cell }) => <div className="whitespace-normal">{cell.getValue()}</div>,
      enableColumnFilter: true,
      meta: { label: "Lokasyon", variant: "multiSelect", options: options(movements.map((m) => m.lokasyonName ?? "Yolda")) },
    }),
    column.accessor((m) => Number(m.quantity), {
      id: "miktar",
      size: 90,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Miktar" className="ml-auto" />,
      cell: ({ row }) => (
        <div
          className={cn(
            "text-right font-medium tabular-nums",
            Number(row.original.quantity) < 0 ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400",
          )}
        >
          {displayQuantity(row.original.quantity)} {unitLabels[row.original.unit]}
        </div>
      ),
      meta: { label: "Miktar" },
    }),
    ...(values
      ? [
          column.accessor((m) => values[m.id]?.unit ?? 0, {
            id: "birim",
            size: 100,
            header: ({ column }) => <DataTableColumnHeader column={column} label="Birim fiyat" className="ml-auto" />,
            cell: ({ row }) => <Money price={values[row.original.id]} pick="unit" />,
            meta: { label: "Birim fiyat" },
          }),
          column.accessor((m) => values[m.id]?.total ?? 0, {
            id: "tutar",
            size: 110,
            header: ({ column }) => <DataTableColumnHeader column={column} label="Tutar" className="ml-auto" />,
            cell: ({ row }) => <Money price={values[row.original.id]} pick="total" />,
            meta: { label: "Tutar" },
          }),
        ]
      : []),
    column.accessor("userName", {
      id: "kullanici",
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kullanıcı" />,
      cell: ({ cell }) => <div className="whitespace-normal">{cell.getValue()}</div>,
      enableColumnFilter: true,
      meta: { label: "Kullanıcı", variant: "multiSelect", options: options(movements.map((m) => m.userName)) },
    }),
    column.accessor((m) => document(m), {
      id: "belge",
      size: 220,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Belge / neden" />,
      cell: ({ cell }) => <div className="whitespace-normal">{cell.getValue()}</div>,
      enableSorting: false,
      meta: { label: "Belge / neden" },
    }),
    ...(canReverse
      ? [
          column.display({
            id: "ters",
            size: 70,
            header: () => null,
            cell: ({ row }) =>
              !corrected(row.original) &&
              (correctable ? <StockOutRowActions movement={row.original} /> : <ReverseButton action={reverseMovementAction.bind(null, row.original.id)} />),
            enableHiding: false,
          }),
        ]
      : []),
  ]);

  const { table } = useClientDataTable({ data: rows, columns, sorting: [{ id: "zaman", desc: true }] });

  return (
    <DataTable table={table} aria-label="Stok hareketleri">
      <DataTableToolbar table={table} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilteredRows table={table}>{(shown) => <Totals shown={shown} values={values} />}</FilteredRows>
        {correctable && reversed.size > 0 && (
          <Label className="text-muted-foreground gap-2 text-xs font-normal">
            <Switch checked={showCorrected} onCheckedChange={setShowCorrected} />
            Düzeltilenleri göster
          </Label>
        )}
      </div>
    </DataTable>
  );
}

const quantityFormat = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 });

// TL over USD; "≈" when priced from today's list instead of an invoice.
function Money({ price, pick }: { price: MovementPrice | undefined; pick: "unit" | "total" }) {
  const value = price?.[pick];
  if (value == null) return <div className="text-muted-foreground text-right">—</div>;
  return (
    <div className={cn("flex flex-col items-end tabular-nums", price!.estimate && "text-muted-foreground")} title={price!.estimate ? "Faturası yok; bugünkü liste fiyatıyla" : undefined}>
      <span>
        {price!.estimate && "≈ "}
        {tl(value)}
      </span>
      {price!.usdRate && <span className="text-muted-foreground text-xs">{usd(value / price!.usdRate)}</span>}
    </div>
  );
}

// Over the filtered rows: Miktar per unit (signed, so out is negative) and, for Finans holders, Tutar in TL and USD.
// A built line's materials share its price, so each line is counted once.
function Totals({ shown, values }: { shown: Movement[]; values?: Record<string, MovementPrice> }) {
  const byUnit = new Map<Movement["unit"], string>();
  for (const m of shown) byUnit.set(m.unit, addQuantities(byUnit.get(m.unit) ?? "0", m.quantity));
  const priced = new Map<string, MovementPrice>();
  for (const m of shown) if (values?.[m.id]?.total != null) priced.set(values[m.id].key, values[m.id]);
  const sum = (f: (p: MovementPrice) => number) => [...priced.values()].reduce((s, p) => s + f(p), 0);
  const usdKnown = [...priced.values()].every((p) => p.usdRate);
  return (
    <p className="text-muted-foreground text-xs tabular-nums">
      <b className="text-foreground font-medium">{shown.length.toLocaleString("tr-TR")}</b> hareket
      {[...byUnit].map(([unit, total]) => (
        <span key={unit}>
          {" "}
          ·{" "}
          <b className="text-foreground font-medium">
            {quantityFormat.format(Number(total))} {unitLabels[unit]}
          </b>
        </span>
      ))}
      {priced.size > 0 && (
        <>
          {" "}
          · Tutar <b className="text-foreground font-medium">{tl(sum((p) => p.total!))}</b>
          {usdKnown && <> · {usd(sum((p) => p.total! / p.usdRate!))}</>}
        </>
      )}
    </p>
  );
}
