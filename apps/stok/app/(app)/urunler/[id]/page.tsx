import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@artek/ui/components/table";
import { EditStock } from "@/components/edit-stock";
import { MovementTable } from "@/components/movement-table";
import { loadActor } from "@/lib/guard";
import { displayQuantity } from "@/lib/labels";
import { getBalances, listMovements, visibleLokasyonIds } from "@/lib/ledger";
import { addQuantities, unitLabels } from "@/lib/quantity";
import { inTransit } from "@/lib/transfers";
import { listLokasyon } from "@/lib/lokasyon";
import { can } from "@/lib/permissions";
import { getProduct, listCategories } from "@/lib/products";
import { Pencil } from "lucide-react";
import { archiveProductAction, restoreProductAction } from "../actions";
import { DateRangeForm, type DateRangeParams } from "@/components/date-range-form";
import { ProductImage } from "@/components/product-image";
import { ProductSheet } from "../product-sheet";
import { dayRange } from "@/lib/time";

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<DateRangeParams> }) {
  const { id } = await params;
  const dates = await searchParams;
  const range = dayRange(dates);
  const requestHeaders = await headers();
  const [actor, product, lokasyon, categories] = await Promise.all([
    loadActor(requestHeaders),
    getProduct(requestHeaders, id),
    listLokasyon(),
    listCategories(requestHeaders),
  ]);
  if (!product) notFound();
  const [balances, movements, transit] = await Promise.all([
    getBalances(requestHeaders, product.id),
    listMovements(requestHeaders, { productId: product.id, ...range, limit: range.bounded ? undefined : 20 }),
    visibleLokasyonIds(actor).then((visible) => inTransit(product.id, visible)),
  ]);
  // On-the-way stock to or from the user's Lokasyon counts in their total, as in the overview.
  const showTransit = transit !== "0";
  const canManage = can(actor, "products.manage");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-4">
        <ProductImage path={product.images[0]} alt={product.name} className="size-32" />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <span className="text-muted-foreground font-mono">{product.code}</span>
            {product.archivedAt && <Badge variant="outline">Arşivde</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">
            {[product.category, product.manufacturer, product.manufacturerCode].filter(Boolean).join(" · ")}
          </p>
          <div className="flex flex-wrap gap-2">
            <ProductSheet
              mode="edit"
              id={product.id}
              name={product.name}
              product={product}
              lokasyon={lokasyon}
              categories={categories}
              readOnly={!canManage}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil /> {canManage ? "Ürün bilgilerini düzenle" : "Ürün bilgileri"}
                </Button>
              }
            />
            {canManage && (
              <form action={(product.archivedAt ? restoreProductAction : archiveProductAction).bind(null, product.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  {product.archivedAt ? "Arşivden çıkar" : "Arşivle"}
                </Button>
              </form>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {product.images.slice(1).map((path) => (
                <ProductImage key={path} path={path} alt={product.name} className="size-14" />
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Stok</h2>
          <Link href={`/stok-girisi?q=${encodeURIComponent(product.code)}`} className="text-sm underline underline-offset-4">
            Stok gir
          </Link>
        </div>
        <Table className="max-w-2xl">
          <TableHeader>
            <TableRow>
              <TableHead>Lokasyon</TableHead>
              <TableHead className="text-right">Fiziksel</TableHead>
              <TableHead className="text-right">Ayrılmış</TableHead>
              <TableHead className="text-right">Kullanılabilir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.lokasyon.map((b) => (
              <TableRow key={b.lokasyonId}>
                <TableCell>{b.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  <div className="flex items-center justify-end gap-1">
                    {lokasyon.find((l) => l.id === b.lokasyonId)?.openedAt && can(actor, "stock.correct", b.lokasyonId) && (
                      <EditStock productId={product.id} lokasyonId={b.lokasyonId} label={`${product.code} ${b.name}`} current={b.physical} />
                    )}
                    {displayQuantity(b.physical)}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{displayQuantity(b.reserved)}</TableCell>
                <TableCell className="text-right tabular-nums">{displayQuantity(b.available)}</TableCell>
              </TableRow>
            ))}
            {showTransit && (
              <TableRow>
                <TableCell>Yolda (transferde)</TableCell>
                <TableCell className="text-right tabular-nums">{displayQuantity(transit)}</TableCell>
                <TableCell className="text-muted-foreground text-right">—</TableCell>
                <TableCell className="text-muted-foreground text-right">—</TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>
                {balances.isCompanyTotal ? "Şirket toplamı" : "Lokasyonlarınızın toplamı"} ({unitLabels[product.unit]})
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {displayQuantity(showTransit ? addQuantities(balances.total.physical, transit) : balances.total.physical)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{displayQuantity(balances.total.reserved)}</TableCell>
              <TableCell className="text-right tabular-nums">{displayQuantity(balances.total.available)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Son hareketler</h2>
          <Link href={`/hareketler?urun=${product.id}`} className="text-sm underline underline-offset-4">
            Tümü
          </Link>
        </div>
        <DateRangeForm params={dates} />
        <MovementTable key={range.key} movements={movements} canReverse={can(actor, "stock.reverse")} />
      </section>

    </div>
  );
}
