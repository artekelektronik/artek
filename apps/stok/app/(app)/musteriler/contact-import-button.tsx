"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { importContactsAction } from "./actions";

// Loads iletisim.json (contact routes researched from the companies' own sites) onto the customers.
export function ContactImportButton() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function load(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await importContactsAction(JSON.parse(await file.text()));
      setMessage(
        result.error
          ? { text: result.error, error: true }
          : { text: `${result.updated} müşterinin iletişim bilgisi eklendi, ${result.skipped} kayıt atlandı (bilgisi olmayan ya da emin olunamayanlar).` },
      );
      router.refresh();
    } catch {
      setMessage({ text: "Dosya okunamadı; iletisim.json dosyasını seçtiğinizden emin olun.", error: true });
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={input}
        id="iletisim-dosyasi"
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) load(file);
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
        <Upload />
        {busy ? "Yükleniyor…" : "İletişim bilgilerini yükle"}
      </Button>
      {message && <span className={message.error ? "text-destructive text-xs" : "text-muted-foreground text-xs"}>{message.text}</span>}
    </div>
  );
}
