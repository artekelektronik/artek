import { Package } from "lucide-react";
import { cn } from "@artek/ui/lib/utils";
import { productImageUrl } from "@/lib/product-images";

// A product's picture from the Vitrin, or a placeholder when it has none.
export function ProductImage({ path, alt, className }: { path?: string | null; alt: string; className?: string }) {
  const box = cn("bg-muted flex shrink-0 items-center justify-center overflow-hidden rounded-md border", className);
  if (!path) {
    return (
      <div className={box} aria-hidden>
        <Package className="text-muted-foreground size-1/2" />
      </div>
    );
  }
  return (
    <div className={box}>
      {/* eslint-disable-next-line @next/next/no-img-element -- served by the Vitrin, not this app */}
      <img src={productImageUrl(path)} alt={alt} loading="lazy" className="size-full object-contain" />
    </div>
  );
}
