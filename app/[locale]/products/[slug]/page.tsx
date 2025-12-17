"use client";

import { Suspense } from "react";
import { use } from "react";
import { useTranslations } from "next-intl";
import { useProduct } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, ShoppingCart, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

function ProductDetailContent({ slug }: { slug: string }) {
  const t = useTranslations("productDetail");
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
            {t("backButton")}
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold">{t("notFound")}</p>
                <p className="text-sm">{t("notFoundDescription")}</p>
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
    "Stock Quantity": totalStock,
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
          {t("backButton")}
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
              {inStock ? t("inStock") : t("outOfStock")}
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
                  {t("code")} {productCode}
                </Badge>
              )}
            </div>
          </div>

          {/* Pricing Section */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              {unitPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("unitPrice")}</span>
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
                  <span className="text-muted-foreground">{t("retailPrice")}</span>
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
                  <span className="text-muted-foreground">{t("wholesalePrice")}</span>
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
                  <span className="text-muted-foreground">{t("wholesaleBase")}</span>
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
                  {t("aiSummary")}
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
              <h3 className="font-semibold mb-2">{t("description")}</h3>
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>
          )}

          {/* Additional Information */}
          {(altCategories?.length || productTypes?.length || supplierCountries?.length) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">{t("additionalInfo")}</h3>
                
                {altCategories && altCategories.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      {t("altCategories")}
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
                      {t("productTypes")}
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
                      {t("supplierCountries")}
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
            {inStock ? t("addToCart") : t("outOfStockButton")}
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
