"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { cn } from "@artek/ui/lib/utils";
import { productImageUrl } from "@/lib/product-images";

// The first image is the main one; uploads go straight to Blob, removed files are deleted on save.
export function ProductImagesField({ initial, readOnly }: { initial: string[]; readOnly?: boolean }) {
  const [images, setImages] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function add(files: FileList | File[]) {
    setError(undefined);
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading((n) => n + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          const blob = await upload(`urunler/${file.name}`, file, { access: "public", handleUploadUrl: "/api/urunler/gorsel" });
          setImages((current) => [...current, blob.url]);
        } catch (e) {
          setError(`${file.name} yüklenemedi: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  }

  function move(index: number, to: number) {
    setImages((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {images.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}
      <div
        className={cn(
          "grid grid-cols-2 gap-3 rounded-lg sm:grid-cols-3 lg:grid-cols-4",
          dragging && "ring-ring ring-2 ring-offset-2",
        )}
        onDragOver={(e) => {
          if (readOnly) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (readOnly) return;
          e.preventDefault();
          setDragging(false);
          void add(e.dataTransfer.files);
        }}
      >
        {images.map((url, index) => (
          <figure key={url} className="group bg-muted relative aspect-square overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element -- Blob or Vitrin URL, not this app */}
            <img src={productImageUrl(url)} alt={`Görsel ${index + 1}`} className="size-full object-contain" />
            {index === 0 && (
              <Badge className="absolute top-2 left-2" variant="secondary">
                <Star /> Ana görsel
              </Badge>
            )}
            {!readOnly && (
              <div className="bg-background/90 absolute inset-x-0 bottom-0 flex justify-between gap-1 p-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <div className="flex gap-1">
                  <Button type="button" size="icon" variant="ghost" className="size-7" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="Sola taşı">
                    <ArrowLeft />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    disabled={index === images.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label="Sağa taşı"
                  >
                    <ArrowRight />
                  </Button>
                  {index > 0 && (
                    <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => move(index, 0)} aria-label="Ana görsel yap">
                      <Star />
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive size-7"
                  onClick={() => setImages((current) => current.filter((u) => u !== url))}
                  aria-label="Görseli kaldır"
                >
                  <X />
                </Button>
              </div>
            )}
          </figure>
        ))}
        {!readOnly && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="text-muted-foreground hover:bg-muted/50 flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm"
          >
            {uploading > 0 ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            {uploading > 0 ? "Yükleniyor…" : "Görsel ekle"}
            <span className="text-xs">veya buraya sürükleyin</span>
          </button>
        )}
        {readOnly && images.length === 0 && <p className="text-muted-foreground text-sm">Görsel yok.</p>}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void add(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-muted-foreground text-xs">JPEG, PNG, WebP, AVIF veya GIF; en fazla 5 MB. İlk görsel listede ve sitede gösterilir.</p>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
