"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { unzipSync } from "fflate";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@artek/ui/components/button";
import type { ImportResult } from "@/lib/invoices";
import { useFatura } from "./use-fatura";

type Row = { file: string } & (ImportResult | { status: "hata"; reason: string });

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

// One invoice opens in the review sheet; a batch ends with a summary toast.
export function InvoiceUpload() {
  const router = useRouter();
  const [, setFatura] = useFatura();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function upload(files: File[]) {
    const pdfs = await pdfsFrom(files);
    if (!pdfs.length) {
      toast.error("PDF ya da PDF içeren zip seçin.");
      return;
    }
    const rows: Row[] = [];
    setProgress({ done: 0, total: pdfs.length });
    for (const pdf of pdfs) {
      const body = new FormData();
      body.set("file", pdf);
      try {
        const response = await fetch("/api/faturalar", { method: "POST", body });
        const json = await response.json();
        rows.push(response.ok ? { file: pdf.name, ...json } : { file: pdf.name, status: "hata", reason: json.error ?? `Sunucu ${response.status}` });
      } catch {
        rows.push({ file: pdf.name, status: "hata", reason: "Bağlantı koptu; bu dosyayı tekrar yükleyin." });
      }
      setProgress({ done: rows.length, total: pdfs.length });
    }
    setProgress(null);

    const problems = rows.filter((r) => r.status === "okunamadi" || r.status === "hata");
    for (const p of problems) toast.error(`${p.file} okunamadı`, { description: "reason" in p ? p.reason : undefined });
    const [only] = rows;
    if (rows.length === 1 && "id" in only) {
      setFatura(only.id);
      return;
    }
    const added = rows.filter((r) => r.status === "eklendi").length;
    const repeats = rows.filter((r) => r.status === "tekrar").length;
    if (added || repeats) {
      toast.success(`${added} fatura eklendi${repeats ? `, ${repeats} zaten vardı` : ""}.`, {
        description: added ? "Listede “Onay bekliyor” olarak duruyorlar; her birini açıp onaylayın." : undefined,
      });
    }
    router.refresh();
  }

  return (
    <>
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
      <Button type="button" disabled={progress !== null} onClick={() => input.current?.click()}>
        <Upload />
        {progress ? `Yükleniyor ${progress.done}/${progress.total}…` : "Fatura yükle"}
      </Button>
    </>
  );
}
