"use client";

import { createContext, useContext, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Archive, ArchiveRestore, ChevronRight, MoreHorizontal, Pencil } from "lucide-react";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@artek/ui/components/dropdown-menu";
import { Switch } from "@artek/ui/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@artek/ui/components/tabs";
import { cn } from "@artek/ui/lib/utils";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { columnHelperFor, option, searchColumn, useClientDataTable } from "@/components/data-table/columns";
import { ProductImage } from "@/components/product-image";
import { displayQuantity } from "@/lib/labels";
import { unitLabels, type Unit } from "@/lib/quantity";
import { archiveProductAction, restoreProductAction, setShowOnSiteAction } from "./actions";

export type ProductStatus = "stokta" | "kritik" | "yok" | "arsiv";

export type ProductRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  manufacturer: string | null;
  manufacturerCode: string | null;
  description: string | null;
  isTradeGoods: boolean;
  isMaterial: boolean;
  unit: Unit;
  showOnSite: boolean;
  images: string[];
  minLevel: string | null;
  stock: { lokasyonId: string; name: string; physical: string; available: string }[];
  inTransit: string;
  total: string;
  status: ProductStatus;
};

const statusStyle: Record<ProductStatus, { label: string; dot: string; pill: string }> = {
  stokta: { label: "Stokta", dot: "bg-green-600", pill: "border-green-600/30 bg-green-600/10 text-green-800" },
  kritik: { label: "Kritik seviye", dot: "bg-amber-500", pill: "border-amber-500/40 bg-amber-500/10 text-amber-800" },
  yok: { label: "Stok yok", dot: "bg-red-600", pill: "border-red-600/30 bg-red-600/10 text-red-700" },
  arsiv: { label: "Arşivde", dot: "bg-muted-foreground", pill: "text-muted-foreground" },
};

function StatusPill({ status }: { status: ProductStatus }) {
  const s = statusStyle[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", s.pill)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

const tabs = ["tumu", "stokta", "kritik", "yok"] as const;
const tabLabels: Record<(typeof tabs)[number], string> = { tumu: "Tümü", stokta: "Stokta", kritik: "Kritik seviye", yok: "Stok yok" };

const column = columnHelperFor<ProductRow>();

// Open rows live in a context: tablecn memoizes rows, so cells wouldn't see a prop change.
const ExpandedRows = createContext<{ open: Set<string>; toggle: (id: string) => void }>({ open: new Set(), toggle: () => {} });

function ExpandButton({ row }: { row: ProductRow }) {
  const { open, toggle } = useContext(ExpandedRows);
  const isOpen = open.has(row.id);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={() => toggle(row.id)}
      aria-expanded={isOpen}
      aria-label={`${row.name} ayrıntıları`}
    >
      <ChevronRight className={cn("transition-transform", isOpen && "rotate-90")} />
    </Button>
  );
}
const typeLabels = { tradeGoods: "Ticari mal", material: "Malzeme" };
const types = (p: ProductRow) => [p.isTradeGoods && typeLabels.tradeGoods, p.isMaterial && typeLabels.material].filter(Boolean) as string[];

// Optimistic; reverts if the server refuses.
function ShowOnSiteSwitch({ row, canManage }: { row: ProductRow; canManage: boolean }) {
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(row.showOnSite);
  const [error, setError] = useState<string>();
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={shown}
        disabled={!canManage || pending}
        aria-label={`${row.name} sitede gösterilsin`}
        onCheckedChange={(next) =>
          startTransition(async () => {
            setError(undefined);
            setShown(next);
            const state = await setShowOnSiteAction(row.id, next);
            if (state?.error) setError(state.error);
          })
        }
      />
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}

function RowActions({ row, canManage, archived }: { row: ProductRow; canManage: boolean; archived: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="outline" size="sm">
        <Link href={`/urunler/${row.id}`}>
          <Pencil /> {canManage ? "Düzenle" : "Aç"}
        </Link>
      </Button>
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label={`${row.name} için diğer işlemler`} disabled={pending}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {archived ? (
              <DropdownMenuItem onSelect={() => startTransition(() => restoreProductAction(row.id))}>
                <ArchiveRestore /> Arşivden çıkar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => startTransition(() => archiveProductAction(row.id))}>
                <Archive /> Arşivle
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function ProductDetail({ row }: { row: ProductRow }) {
  const unit = unitLabels[row.unit];
  return (
    <div className="grid gap-6 p-4 md:grid-cols-[auto_1fr_auto]">
      <div className="flex flex-wrap gap-2">
        {row.images.length ? (
          row.images.slice(0, 4).map((path) => <ProductImage key={path} path={path} alt={row.name} className="size-20" />)
        ) : (
          <ProductImage alt={row.name} className="size-20" />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1 text-sm">
        <p className="font-medium">{row.name}</p>
        <p className="text-muted-foreground">
          {[row.manufacturer, row.manufacturerCode].filter(Boolean).join(" · ") || "Üretici bilgisi yok"}
        </p>
        {row.description && <p className="text-muted-foreground line-clamp-3 whitespace-pre-line">{row.description}</p>}
      </div>
      {row.status !== "arsiv" && (
        <Table className="w-auto">
          <TableHeader>
            <TableRow>
              <TableHead>Lokasyon</TableHead>
              <TableHead className="text-right">Fiziksel</TableHead>
              <TableHead className="text-right">Kullanılabilir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {row.stock.map((s) => (
              <TableRow key={s.lokasyonId}>
                <TableCell>{s.name}</TableCell>
                <TableCell className="text-right">{displayQuantity(s.physical)}</TableCell>
                <TableCell className="text-right">{displayQuantity(s.available)}</TableCell>
              </TableRow>
            ))}
            {row.inTransit !== "0" && (
              <TableRow>
                <TableCell>Yolda</TableCell>
                <TableCell className="text-right">{displayQuantity(row.inTransit)}</TableCell>
                <TableCell className="text-muted-foreground text-right">—</TableCell>
              </TableRow>
            )}
            <TableRow className="font-medium">
              <TableCell>Toplam ({unit})</TableCell>
              <TableCell className="text-right">{displayQuantity(row.total)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// Inventory view after AG Grid's demo, built with tablecn.
export function ProductsTable({
  rows,
  categories,
  canManage,
  comparesMinimum,
  archived,
}: {
  rows: ProductRow[];
  categories: string[];
  canManage: boolean;
  comparesMinimum: boolean;
  archived: boolean;
}) {
  const [tab, setTab] = useQueryState("durum", parseAsStringLiteral(tabs).withDefault("tumu"));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const counts = Object.fromEntries(tabs.map((t) => [t, t === "tumu" ? rows.length : rows.filter((r) => r.status === t).length]));
  const shown = archived || tab === "tumu" ? rows : rows.filter((r) => r.status === tab);
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const columns = column.columns([
    searchColumn<ProductRow>((p) => [p.code, p.name, p.manufacturerCode, p.manufacturer].filter(Boolean).join(" "), "Kod, ad, üretici"),
    column.display({
      id: "ac",
      size: 40,
      header: () => null,
      cell: ({ row }) => <ExpandButton row={row.original} />,
      enableHiding: false,
    }),
    column.accessor("name", {
      id: "urun",
      size: 340,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Ürün" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <ProductImage path={row.original.images[0]} alt={row.original.name} className="size-11" />
          <div className="flex min-w-0 flex-col gap-1">
            <Link href={`/urunler/${row.original.id}`} className="truncate font-medium underline-offset-4 hover:underline">
              {row.original.name}
            </Link>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="font-normal">
                {row.original.category}
              </Badge>
              <span className="text-muted-foreground truncate font-mono text-xs">{row.original.code}</span>
            </div>
          </div>
        </div>
      ),
      enableHiding: false,
    }),
    column.accessor("category", {
      id: "kategori",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Kategori" />,
      enableColumnFilter: true,
      meta: { label: "Kategori", variant: "multiSelect", options: categories.map(option) },
    }),
    column.accessor((p) => statusStyle[p.status].label, {
      id: "durum",
      size: 150,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Durum" />,
      cell: ({ row }) => <StatusPill status={row.original.status} />,
      meta: { label: "Durum" },
    }),
    column.accessor((p) => Number(p.total), {
      id: "stok",
      size: 190,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Stok" />,
      cell: ({ row }) => {
        const p = row.original;
        if (p.status === "arsiv") return <span className="text-muted-foreground">—</span>;
        const level = comparesMinimum && p.minLevel ? Number(p.minLevel) : null;
        // The bar fills at twice the Kritik seviye, so half-full is the warning line.
        const fill = level ? Math.min(100, (Number(p.total) / (level * 2)) * 100) : null;
        return (
          <div className="flex flex-col gap-1">
            <span className="tabular-nums">
              <span className="font-medium">{displayQuantity(p.total)}</span> {unitLabels[p.unit]}
              {level !== null && <span className="text-muted-foreground text-xs"> / kritik {displayQuantity(p.minLevel!)}</span>}
            </span>
            {fill !== null && (
              <div className="bg-muted h-1.5 w-full max-w-36 overflow-hidden rounded-full">
                <div
                  className={cn("h-full rounded-full", statusStyle[p.status].dot)}
                  style={{ width: `${fill}%` }}
                />
              </div>
            )}
            <span className="text-muted-foreground truncate text-xs">
              {p.stock.map((s) => `${s.name.split(" ")[0]} ${displayQuantity(s.physical)}`).join(" · ")}
            </span>
          </div>
        );
      },
      meta: { label: "Stok" },
    }),
    column.accessor((p) => types(p), {
      id: "tur",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tür" />,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.isTradeGoods && <Badge variant="secondary">{typeLabels.tradeGoods}</Badge>}
          {row.original.isMaterial && <Badge variant="outline">{typeLabels.material}</Badge>}
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: "Tür",
        variant: "multiSelect",
        options: Object.values(typeLabels).map(option),
      },
    }),
    column.accessor((p) => (p.showOnSite ? "evet" : "hayir"), {
      id: "sitede",
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Sitede" />,
      cell: ({ row }) => <ShowOnSiteSwitch row={row.original} canManage={canManage} />,
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
    column.display({
      id: "islemler",
      size: 150,
      header: () => <span className="sr-only">İşlemler</span>,
      cell: ({ row }) => <RowActions row={row.original} canManage={canManage} archived={archived} />,
      enableHiding: false,
    }),
  ]);

  const { table } = useClientDataTable({ data: shown, columns, hidden: ["kategori"] });

  return (
    <ExpandedRows.Provider value={{ open: expanded, toggle }}>
      <div className="flex flex-col gap-3">
        {!archived && (
          <Tabs
            value={tab}
            onValueChange={(value) => {
              void setTab(value as (typeof tabs)[number]);
              table.setPageIndex(0);
            }}
          >
            <TabsList>
              {tabs
                .filter((t) => t !== "kritik" || comparesMinimum)
                .map((t) => (
                  <TabsTrigger key={t} value={t} className="gap-1.5">
                    {tabLabels[t]}
                    <span className="text-muted-foreground text-xs tabular-nums">{counts[t]}</span>
                  </TabsTrigger>
                ))}
            </TabsList>
          </Tabs>
        )}
        <DataTable
          table={table}
          aria-label="Ürünler"
          renderRowDetail={(row) => (expanded.has(row.original.id) ? <ProductDetail row={row.original} /> : null)}
        >
          <DataTableToolbar table={table} />
        </DataTable>
      </div>
    </ExpandedRows.Provider>
  );
}
