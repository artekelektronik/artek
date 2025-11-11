"use client";

import { useProduct } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: product, isLoading, error } = useProduct(params.id);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <p className="font-semibold">Hata</p>
          <p className="text-sm">Ürün bulunamadı</p>
        </div>
      </div>
    );
  }

  const {
    "Product Name": name,
    Category: category,
    "Unit Price": unitPrice,
    "Parakende Fiyatı": retailPrice,
    "Stock Quantity": stock,
    Description: description,
    "Alt Kategori": altCategories,
    "Ürün Tipi": productTypes,
    "Supplier Country": supplierCountries,
  } = product.fields;

  const price = unitPrice || retailPrice || 0;
  const inStock = (stock || 0) > 0;

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Link href="/products">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Ürünlere Dön
        </Button>
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image Placeholder */}
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
          <Package className="h-24 w-24 text-muted-foreground" />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{name}</h1>
            {category && (
              <Badge variant="secondary" className="mb-4">
                {category}
              </Badge>
            )}
          </div>

          <div className="text-3xl font-bold">₺{price.toLocaleString("tr-TR")}</div>

          {description && (
            <div>
              <h3 className="font-semibold mb-2">Açıklama</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Stok:</span>
              <Badge variant={inStock ? "default" : "destructive"}>
                {inStock ? `${stock} adet` : "Stokta Yok"}
              </Badge>
            </div>

            {altCategories && altCategories.length > 0 && (
              <div>
                <span className="font-semibold">Alt Kategori:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {altCategories.map((cat) => (
                    <Badge key={cat} variant="outline">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {productTypes && productTypes.length > 0 && (
              <div>
                <span className="font-semibold">Ürün Tipi:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {productTypes.map((type) => (
                    <Badge key={type} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {supplierCountries && supplierCountries.length > 0 && (
              <div>
                <span className="font-semibold">Tedarikçi Ülke:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {supplierCountries.map((country) => (
                    <Badge key={country} variant="outline">
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button size="lg" className="w-full" disabled={!inStock}>
            {inStock ? "Sepete Ekle" : "Stokta Yok"}
          </Button>
        </div>
      </div>
    </div>
  );
}
