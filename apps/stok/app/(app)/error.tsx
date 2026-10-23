"use client";

import { Button } from "@artek/ui/components/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold">Bir hata oluştu</h1>
      <p className="text-muted-foreground">İşlem tamamlanamadı. Tekrar deneyin; sorun sürerse yöneticinize haber verin.</p>
      <Button variant="outline" onClick={reset}>
        Tekrar dene
      </Button>
    </div>
  );
}
