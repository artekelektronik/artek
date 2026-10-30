"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { unzipSync } from "fflate";
import { FileUp } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Progress } from "@artek/ui/components/progress";
import type { ImportResult } from "@/lib/invoices";

type Row = { file: string } & (ImportResult | { status: "hata"; reason: string });

const statusText = { eklendi: "Eklendi", tekrar: "Zaten vardı", okunamadi: "Okunamadı", hata: "Hata" } as const;

// PDFs and zips of PDFs (as GİB / QNB exports them), sent to the server one at a time.
async function pdfsFrom(files: File[]) {
  const out: File[] = [];
  for (const file of files) {
    if (/\.zip$/i.test(file.name)) {
      const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
      for (const [name, data] of Object.entries(entries)) {
        if (/\.pdf$/i.test(name) && !name.startsWith("__MACOSX/")) {
          out.push(new File([data.slice()], name.split("/").pop()!, { type: "application/pdf" }));
        }
      }
    } else if (/\.pdf$/i.test(file.name)) {
      out.push(file);
    }
  }
  return out;
}

export function InvoiceUpload() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(files: File[]) {
    setBusy(true);
    setRows([]);
    const pdfs = await pdfsFrom(files);
    setTotal(pdfs.length);
    for (const pdf of pdfs) {
      const body = new FormData();
      body.set("file", pdf);
      let row: Row;
      try {
        const response = await fetch("/api/faturalar", { method: "POST", body });
        const json = await response.json();
        row = response.ok ? { file: pdf.name, ...json } : { file: pdf.name, status: "hata", reason: json.error ?? `Sunucu ${response.status}` };
      } catch {
        row = { file: pdf.name, status: "hata", reason: "Bağlantı koptu; bu dosyayı tekrar yükleyin." };
      }
      setRows((r) => [...r, row]);
    }
    setBusy(false);
    router.refresh();
  }

  const count = (s: Row["status"]) => rows.filter((r) => r.status === s).length;
  const problems = rows.filter((r) => r.status === "okunamadi" || r.status === "hata");

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) upload([...e.dataTransfer.files]);
        }}
        className={`flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-4 py-3 ${dragging ? "border-primary bg-muted" : "border-border"}`}
      >
        <FileUp className="text-muted-foreground size-5" />
        <p className="text-muted-foreground flex-1 text-sm">
          Fatura PDF’lerini veya zip dosyasını buraya bırakın. Aynı fatura iki kez yüklenirse ikincisi eklenmez.
        </p>
        <input
          ref={input}
          id="fatura-dosyalari"
          type="file"
          multiple
          accept=".pdf,.zip,application/pdf,application/zip"
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (files.length) upload(files);
          }}
        />
        <Button type="button" disabled={busy} onClick={() => input.current?.click()}>
          Dosya seç
        </Button>
      </div>

      {total > 0 && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <Progress value={(rows.length / total) * 100} />
          <p className="text-sm tabular-nums">
            {rows.length} / {total} dosya · {count("eklendi")} eklendi · {count("tekrar")} zaten vardı ·{" "}
            {count("okunamadi") + count("hata")} sorunlu
            {!busy && " · Bitti"}
          </p>
          {problems.length > 0 && (
            <ul className="text-destructive text-sm">
              {problems.map((r) => (
                <li key={r.file}>
                  {r.file}: {statusText[r.status]}. {"reason" in r ? r.reason : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
