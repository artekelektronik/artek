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
import {
  ArrowLeft,
  Package,
  Copy,
  Share2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

import { useState } from "react";

const WHATSAPP_PHONE = "905551234567";

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function ProductDetailContent({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const t = useTranslations("productDetail");
  const { data: product, isLoading, error } = useProduct(slug);
  const [copied, setCopied] = useState(false);

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
    Description: description,
    "Alt Kategori": altCategories,
    "Ürün Tipi": productTypes,
    "Supplier Country": supplierCountries,
    Photo: photos,
    "Product Code": productCode,
    "Product Summary (AI)": aiSummary,
  } = product.fields;

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
              <img
                src={photos[0].thumbnails?.large.url || photos[0].url}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-32 w-32 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {hasImages && photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.slice(1, 5).map((photo, idx) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-muted rounded-md overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img
                    src={photo.thumbnails?.small.url || photo.url}
                    alt={`${name} - ${idx + 2}`}
                    className="absolute inset-0 w-full h-full object-cover"
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

          {/* Action Buttons */}
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex-1 gap-2"
              title={t("copyLink")}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("copied")}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("copyLink")}</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const text =
                  locale === "tr"
                    ? `"${name}" ürününe ilgileniyorum. Bilgi alabilir miyim?`
                    : `I'm interested in "${name}". Can you provide more information?`;
                const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
                  text
                )}`;
                window.open(whatsappUrl, "_blank");
              }}
              className="flex-1 gap-2"
              title={t("chatNow")}
            >
              <WhatsAppIcon size={16} />
              <span className="hidden sm:inline">{t("chatNow")}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: name,
                    url: window.location.href,
                  });
                }
              }}
              className="flex-1 gap-2"
              title={t("share")}
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("share")}</span>
            </Button>
          </div>

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
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Additional Information */}
          {(altCategories?.length ||
            productTypes?.length ||
            supplierCountries?.length) && (
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
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = use(params);

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
      <ProductDetailContent slug={slug} locale={locale} />
    </Suspense>
  );
}
