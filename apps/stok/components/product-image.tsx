import { Package } from "lucide-react";
import { cn } from "@artek/ui/lib/utils";
import { productImageUrl } from "@/lib/product-images";

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
      {/* eslint-disable-next-line @next/next/no-img-element -- external URL (Blob or Vitrin) */}
      <img src={productImageUrl(path)} alt={alt} loading="lazy" className="size-full object-contain" />
    </div>
  );
}
