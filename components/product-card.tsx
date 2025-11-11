"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateProductSlug } from "@/lib/utils";
import type { AirtableProduct } from "@/types/airtable";

interface ProductCardProps {
  product: AirtableProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { fields } = product;
  const hasStock = (fields["Stock Quantity"] ?? 0) > 0;
  const primaryPrice = fields["Unit Price"] || fields["Parakende Fiyatı"];
  const productSlug = generateProductSlug(fields["Product Name"], product.id);

  return (
    <div className="group relative flex flex-col h-full bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Section - Fixed aspect ratio */}
      <Link href={`/products/${productSlug}`} className="block relative aspect-square bg-muted">
        {fields.Photo && fields.Photo[0] ? (
          <Image
            src={fields.Photo[0].thumbnails?.large.url || fields.Photo[0].url}
            alt={fields["Product Name"]}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Stock Badge */}
        <Badge
          variant={hasStock ? "default" : "destructive"}
          className="absolute top-3 right-3"
        >
          {hasStock ? "Stokta" : "Tükendi"}
        </Badge>
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

        {/* Location Info - Fixed height */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3.5 w-3.5" />
          <span>
            Karaköy: {fields["Stock (Karakoy)"] ?? 0}
          </span>
        </div>

        {/* Product Code - Fixed height */}
        <div className="min-h-5 mb-3">
          {fields["Product Code"] && (
            <p className="text-xs text-muted-foreground">
              Kod: {fields["Product Code"]}
            </p>
          )}
        </div>

        {/* Spacer to push pricing to bottom */}
        <div className="flex-1" />

        {/* Pricing Section - Fixed height structure */}
        <div className="space-y-1 pt-2 border-t">
          {/* Birim Fiyat - Always show (required) */}
          <div className="flex justify-between items-center min-h-5">
            {fields["Unit Price"] && (
              <>
                <span className="text-xs text-muted-foreground">Birim Fiyat:</span>
                <span className="font-semibold text-sm">
                  ₺{fields["Unit Price"].toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </>
            )}
          </div>
          
          {/* Perakende - Fixed height slot */}
          <div className="flex justify-between items-center min-h-5">
            {fields["Parakende Fiyatı"] && (
              <>
                <span className="text-xs text-muted-foreground">Perakende:</span>
                <span className="text-xs">
                  ₺{fields["Parakende Fiyatı"].toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </>
            )}
          </div>
          
          {/* Toptan - Fixed height slot */}
          <div className="flex justify-between items-center min-h-5">
            {fields["Toptan Fiyatı"] && (
              <>
                <span className="text-xs text-muted-foreground">Toptan:</span>
                <span className="text-xs">
                  ₺{fields["Toptan Fiyatı"].toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Button - Fixed position */}
        <Button asChild variant="default" size="sm" className="w-full mt-4">
          <Link href={`/products/${productSlug}`}>
            Detayları Gör
          </Link>
        </Button>
      </div>
    </div>
  );
}
