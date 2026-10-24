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
import { MovementTable } from "@/components/movement-table";
import { loadActor } from "@/lib/guard";
import { displayQuantity } from "@/lib/labels";
import { getBalances, listMovements, visibleLokasyonIds } from "@/lib/ledger";
import { addQuantities, unitLabels } from "@/lib/quantity";
import { inTransit } from "@/lib/transfers";
import { listLokasyon } from "@/lib/lokasyon";
import { can } from "@/lib/permissions";
import { getProduct, listCategories } from "@/lib/products";
import { archiveProductAction, restoreProductAction, updateProductAction } from "../actions";
import { ProductForm } from "../product-form";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    listMovements(requestHeaders, { productId: product.id }),
    visibleLokasyonIds(actor).then((visible) => inTransit(product.id, visible)),
  ]);
  // Stock on the way belongs to no Lokasyon. As in the overview, a user sees what is on the way to
  // or from their Lokasyon, and it counts in their total.
  const showTransit = transit !== "0";
  const canManage = can(actor, "products.manage");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <span className="text-muted-foreground font-mono">{product.code}</span>
        {product.archivedAt && <Badge variant="outline">Arşivde</Badge>}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Stok</h2>
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
                <TableCell className="text-right tabular-nums">{displayQuantity(b.physical)}</TableCell>
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
        <MovementTable movements={movements.slice(0, 20)} canReverse={can(actor, "stock.reverse")} />
      </section>

      <h2 className="text-lg font-semibold">Ürün bilgileri</h2>
      <ProductForm
        action={updateProductAction.bind(null, product.id)}
        product={product}
        lokasyon={lokasyon}
        categories={categories}
        readOnly={!canManage}
        submitLabel="Kaydet"
      />

      {canManage && (
        <form action={(product.archivedAt ? restoreProductAction : archiveProductAction).bind(null, product.id)}>
          <Button type="submit" variant="outline">
            {product.archivedAt ? "Arşivden çıkar" : "Arşivle"}
          </Button>
        </form>
      )}
    </div>
  );
}
