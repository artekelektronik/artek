"use client";


import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateProductSlug } from "@/lib/utils";
import type { AirtableProduct } from "@/types/airtable";

interface ProductCardProps {
  product: AirtableProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("productCard");
  const { fields } = product;
  const productSlug = generateProductSlug(fields["Product Name"], product.id);

  return (
    <div className="group relative flex flex-col h-full bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Section - Fixed aspect ratio */}
      <Link href={`/products/${productSlug}`} className="block relative aspect-square bg-muted">
        {fields.Photo && fields.Photo[0] ? (
          <img
            src={fields.Photo[0].thumbnails?.large.url || fields.Photo[0].url}
            alt={fields["Product Name"]}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </Link>

      {/* Content Section - Fixed structure */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category Tags - Fixed height */}
        <div className="flex flex-wrap gap-1.5 min-h-6 mb-3">
          {fields.Category && (
            <Badge variant="outline" className="text-xs">
              {fields.Category}
            </Badge>
          )}
          {fields["Ürün Tipi"]?.[0] && (
            <Badge variant="secondary" className="text-xs">
              {fields["Ürün Tipi"][0]}
            </Badge>
          )}
        </div>

        {/* Product Name - Fixed 2 lines */}
        <Link href={`/products/${productSlug}`} className="mb-3">
          <h3 className="font-medium text-base line-clamp-2 min-h-12 hover:underline">
            {fields["Product Name"]}
          </h3>
        </Link>

        {/* Product Code - Fixed height */}
        <div className="min-h-5 mb-3">
          {fields["Product Code"] && (
            <p className="text-xs text-muted-foreground">
              {t("code")} {fields["Product Code"]}
            </p>
          )}
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Action Button - Fixed position */}
        <Button asChild variant="default" size="sm" className="w-full mt-4">
          <Link href={`/products/${productSlug}`}>
            {t("viewDetails")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
