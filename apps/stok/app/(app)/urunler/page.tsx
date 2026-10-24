import { headers } from "next/headers";
import Link from "next/link";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { listCategories, listProducts } from "@/lib/products";
import { unitLabels } from "@/lib/quantity";
import { selectClassName } from "@/lib/ui";

export const metadata = { title: "Ürünler | Artek Stok" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string; arsiv?: string }>;
}) {
  const { q, kategori, arsiv } = await searchParams;
  const requestHeaders = await headers();
  const [actor, rows, categories] = await Promise.all([
    loadActor(requestHeaders),
    listProducts(requestHeaders, { q, category: kategori, archived: arsiv === "1" }),
    listCategories(requestHeaders),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{arsiv === "1" ? "Arşivdeki ürünler" : "Ürünler"}</h1>
        {can(actor, "products.manage") && (
          <Button asChild>
            <Link href="/urunler/yeni">Yeni ürün</Link>
          </Button>
        )}
      </div>

      <form className="flex flex-wrap items-end gap-2">
        <Input name="q" defaultValue={q} placeholder="Kod, ad veya üretici kodu" className="w-64" />
        <select name="kategori" defaultValue={kategori ?? ""} className={`${selectClassName} w-48`} aria-label="Kategori">
          <option value="">Tüm kategoriler</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        {arsiv === "1" && <input type="hidden" name="arsiv" value="1" />}
        <Button type="submit" variant="outline">
          Filtrele
        </Button>
        <Button asChild variant="link">
          <Link href={arsiv === "1" ? "/urunler" : "/urunler?arsiv=1"}>
            {arsiv === "1" ? "Aktif ürünler" : "Arşivdekiler"}
          </Link>
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kod</TableHead>
            <TableHead>Ad</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Birim</TableHead>
            <TableHead>Sitede</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono">
                <Link href={`/urunler/${row.id}`} className="underline-offset-4 hover:underline">
                  {row.code}
                </Link>
              </TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell className="flex gap-1">
                {row.isTradeGoods && <Badge variant="secondary">Ticari mal</Badge>}
                {row.isMaterial && <Badge variant="outline">Malzeme</Badge>}
              </TableCell>
              <TableCell>{unitLabels[row.unit]}</TableCell>
              <TableCell>{row.showOnSite ? "Evet" : "Hayır"}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                Ürün bulunamadı.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <p className="text-muted-foreground text-sm">{rows.length} ürün</p>
    </div>
  );
}
