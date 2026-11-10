import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Boxes, Lock, PackageCheck, Pencil, Plus, Truck } from "lucide-react";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { DateRangeFilter } from "@/components/date-range-filter";
import { EditStock } from "@/components/edit-stock";
import { MovementTable } from "@/components/movement-table";
import { PanelCard, PanelShell } from "@/components/panel";
import { ProductImage } from "@/components/product-image";
import { StatCard } from "@/components/stat-card";
import { loadActor } from "@/lib/guard";
import { displayQuantity } from "@/lib/labels";
import { getBalances, listMovements, visibleLokasyonIds } from "@/lib/ledger";
import { listLokasyon } from "@/lib/lokasyon";
import { can } from "@/lib/permissions";
import { getProduct, listCategories } from "@/lib/products";
import { addQuantities, unitLabels } from "@/lib/quantity";
import { dayRange, type DateRangeParams } from "@/lib/time";
import { inTransit } from "@/lib/transfers";
import { archiveProductAction, restoreProductAction } from "../actions";
import { ProductSheet } from "../product-sheet";

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
  const unit = unitLabels[product.unit];
  const totalLabel = balances.isCompanyTotal ? "Şirket toplamı" : "Lokasyonlarınızın toplamı";
  const physical = showTransit ? addQuantities(balances.total.physical, transit) : balances.total.physical;

  return (
    <PanelShell
      title={product.name}
      lede={
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-foreground font-mono">{product.code}</span>
          {[product.category, product.manufacturer, product.manufacturerCode].filter(Boolean).map((part) => (
            <span key={part}>· {part}</span>
          ))}
          {product.archivedAt && <Badge variant="outline">Arşivde</Badge>}
        </span>
      }
      actions={
        <>
          {canManage && (
            <form action={(product.archivedAt ? restoreProductAction : archiveProductAction).bind(null, product.id)}>
              <Button type="submit" variant="ghost">
                {product.archivedAt ? "Arşivden çıkar" : "Arşivle"}
              </Button>
            </form>
          )}
          <ProductSheet
            mode="edit"
            id={product.id}
            name={product.name}
            product={product}
            lokasyon={lokasyon}
            categories={categories}
            readOnly={!canManage}
            trigger={
              <Button variant="outline">
                <Pencil /> {canManage ? "Düzenle" : "Ürün bilgileri"}
              </Button>
            }
          />
          <Button asChild>
            <Link href={`/stok-girisi?q=${encodeURIComponent(product.code)}`}>
              <Plus /> Stok gir
            </Link>
          </Button>
        </>
      }
    >
      <div className={showTransit ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" : "grid grid-cols-1 gap-3 sm:grid-cols-3"}>
        <StatCard label="Fiziksel" value={`${displayQuantity(physical)} ${unit}`} note={totalLabel} icon={Boxes} />
        <StatCard label="Kullanılabilir" value={`${displayQuantity(balances.total.available)} ${unit}`} note="Fiziksel − ayrılmış" icon={PackageCheck} />
        <StatCard label="Ayrılmış" value={`${displayQuantity(balances.total.reserved)} ${unit}`} note="Siparişe ayrılan" icon={Lock} />
        {showTransit && <StatCard label="Yolda" value={`${displayQuantity(transit)} ${unit}`} note="Transferde, toplama dahil" icon={Truck} />}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <PanelCard title="Lokasyona göre stok" note={`${totalLabel}, ${unit}.`} className="lg:col-span-2">
          <Table>
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
                    <div className="flex items-center justify-end gap-2">
                      {lokasyon.find((l) => l.id === b.lokasyonId)?.openedAt && can(actor, "stock.correct", b.lokasyonId) && (
                        <EditStock productId={product.id} lokasyonId={b.lokasyonId} label={`${product.code} ${b.name}`} current={b.physical} />
                      )}
                      {displayQuantity(b.physical)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{displayQuantity(b.reserved)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{displayQuantity(b.available)}</TableCell>
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
                <TableCell>{totalLabel}</TableCell>
                <TableCell className="text-right tabular-nums">{displayQuantity(physical)}</TableCell>
                <TableCell className="text-right tabular-nums">{displayQuantity(balances.total.reserved)}</TableCell>
                <TableCell className="text-right tabular-nums">{displayQuantity(balances.total.available)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </PanelCard>

        <PanelCard title="Görseller">
          <ProductImage path={product.images[0]} alt={product.name} className="aspect-square w-full" />
          {product.images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {product.images.slice(1).map((path) => (
                <ProductImage key={path} path={path} alt={product.name} className="size-14" />
              ))}
            </div>
          )}
        </PanelCard>
      </div>

      <PanelCard title={range.from || range.to ? "Hareketler" : "Son hareketler"} note={range.from || range.to ? "Seçilen tarihler arasında." : "En yeni 20 hareket; tarih seçince o aralığın tamamı gelir."}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <DateRangeFilter />
          <Button asChild variant="outline" size="sm">
            <Link href={`/hareketler?urun=${product.id}`}>Tüm hareketler</Link>
          </Button>
        </div>
        <MovementTable key={range.key} movements={movements} canReverse={can(actor, "stock.reverse")} forProduct />
      </PanelCard>
    </PanelShell>
  );
}
