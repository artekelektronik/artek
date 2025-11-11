"use client";

import { Suspense } from "react";
import { use } from "react";
import { useProduct } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, MapPin, ShoppingCart, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function ProductDetailContent({ slug }: { slug: string }) {
  const { data: product, isLoading, error } = useProduct(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <Skeleton className="h-10 w-40 mb-8" />
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-6">
            <div>
              <Skeleton className="h-10 w-3/4 mb-3" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <Link href="/products">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ürünlere Dön
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold">Ürün Bulunamadı</p>
                <p className="text-sm">Bu ürün mevcut değil veya kaldırılmış olabilir.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    "Product Name": name,
    Category: category,
    "Unit Price": unitPrice,
    "Parakende Fiyatı": retailPrice,
    "Toptan Fiyatı": wholesalePrice,
    "Toptan Taban ": wholesaleBase,
    "Alış Fiyatı": purchasePrice,
    "Stock Quantity": totalStock,
    "Stock (Karakoy)": karakoyStock,
    "Stock (Cekmekoy)": cekmekoyStock,
    "Total Stock Value": stockValue,
    Description: description,
    "Alt Kategori": altCategories,
    "Ürün Tipi": productTypes,
    "Supplier Country": supplierCountries,
    Photo: photos,
    "Product Code": productCode,
    "Product Summary (AI)": aiSummary,
  } = product.fields;

  const inStock = (totalStock || 0) > 0;
  const hasImages = photos && photos.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      {/* Back Button */}
      <Link href="/products">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Ürünlere Dön
        </Button>
      </Link>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
            {hasImages ? (
              <Image
                src={photos[0].thumbnails?.large.url || photos[0].url}
                alt={name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-32 w-32 text-muted-foreground" />
              </div>
            )}
            
            {/* Stock Badge Overlay */}
            <Badge
              variant={inStock ? "default" : "destructive"}
              className="absolute top-4 right-4 text-sm"
            >
              {inStock ? "Stokta Var" : "Stokta Yok"}
            </Badge>
          </div>

          {/* Thumbnail Gallery */}
          {hasImages && photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.slice(1, 5).map((photo, idx) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-muted rounded-md overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Image
                    src={photo.thumbnails?.small.url || photo.url}
                    alt={`${name} - ${idx + 2}`}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl lg:text-4xl font-bold">{name}</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {category && (
                <Badge variant="secondary" className="text-sm">
                  {category}
                </Badge>
              )}
              {productCode && (
                <Badge variant="outline" className="text-sm">
                  Kod: {productCode}
                </Badge>
              )}
            </div>
          </div>

          {/* Pricing Section */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              {unitPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Birim Fiyat:</span>
                  <span className="text-2xl font-bold">
                    ₺{unitPrice.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              
              {retailPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Perakende Fiyatı:</span>
                  <span className="text-lg font-semibold">
                    ₺{retailPrice.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {wholesalePrice && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Toptan Fiyatı:</span>
                  <span className="text-lg">
                    ₺{wholesalePrice.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {wholesaleBase && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Toptan Taban:</span>
                  <span className="text-lg">
                    ₺{wholesaleBase.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Summary */}
          {aiSummary?.value && aiSummary.state === "generated" && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  AI Ürün Özeti
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiSummary.value}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {description && (
            <div>
              <h3 className="font-semibold mb-2">Açıklama</h3>
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>
          )}

          {/* Stock Information - Hidden */}
          {/* <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Stok Durumu
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Karaköy</p>
                  <p className="text-2xl font-bold">{karakoyStock || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Çekmeköy</p>
                  <p className="text-2xl font-bold">{cekmekoyStock || 0}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground">Toplam Stok:</span>
              <Badge variant={inStock ? "default" : "secondary"} className="text-base px-3 py-1">
                {totalStock || 0} adet
              </Badge>
            </div>

            {stockValue && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Stok Değeri:</span>
                <span className="font-semibold">
                  ₺{stockValue.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </div> */}

          {/* Additional Information */}
          {(altCategories?.length || productTypes?.length || supplierCountries?.length) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Ek Bilgiler</h3>
                
                {altCategories && altCategories.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      Alt Kategoriler:
                    </span>
                    <div className="flex flex-wrap gap-2">
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
                    <span className="text-sm text-muted-foreground block mb-2">
                      Ürün Tipleri:
                    </span>
                    <div className="flex flex-wrap gap-2">
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
                    <span className="text-sm text-muted-foreground block mb-2">
                      Tedarikçi Ülkeler:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {supplierCountries.map((country) => (
                        <Badge key={country} variant="outline">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Button */}
          <Button size="lg" className="w-full" disabled={!inStock}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {inStock ? "Sepete Ekle" : "Stokta Yok"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 mt-16">
          <Skeleton className="h-10 w-40 mb-8" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-6">
              <div>
                <Skeleton className="h-10 w-3/4 mb-3" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-32 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      }
    >
      <ProductDetailContent slug={slug} />
    </Suspense>
  );
}
