"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
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

// One invoice opens in the review sheet; a batch ends with a summary toast. Files can also be dropped anywhere on the page.
export function InvoiceUpload() {
  const router = useRouter();
  const [, setFatura] = useFatura();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const onDrop = useEffectEvent((files: File[]) => {
    if (progress === null) upload(files);
  });

  useEffect(() => {
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files");
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (!e.relatedTarget) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragging(false);
      onDrop([...e.dataTransfer!.files]);
    };
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, []);

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
    // A repeat is refused, unless it brought the PDF an older upload was missing.
    const repeats = rows.flatMap((r) => (r.status === "tekrar" && !r.pdfAdded ? [r] : []));
    if (repeats.length === 1) {
      const [r] = repeats;
      toast.error(`${r.number} zaten yüklü`, { description: `${r.file} daha önce yüklendi; tekrar eklenmedi.`, action: { label: "Aç", onClick: () => setFatura(r.id) } });
    } else if (repeats.length > 1) {
      toast.error(`${repeats.length} fatura zaten yüklüydü; tekrar eklenmedi.`, { description: repeats.map((r) => r.number).join(", ") });
    }
    const added = rows.flatMap((r) => (r.status === "eklendi" ? [r] : []));
    const pdfAdded = rows.filter((r) => r.status === "tekrar" && r.pdfAdded).length;
    if (rows.length === 1 && added.length === 1) {
      setFatura(added[0].id);
      return;
    }
    if (added.length || pdfAdded) {
      toast.success([added.length && `${added.length} fatura eklendi`, pdfAdded && `${pdfAdded} faturanın PDF’i eklendi`].filter(Boolean).join(", ") + ".", {
        description: added.length ? "Listede “Onay bekliyor” olarak duruyorlar; her birini açıp onaylayın." : undefined,
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
      {dragging && (
        <div className="bg-background/80 pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <p className="border-primary rounded-xl border-2 border-dashed px-10 py-8 text-lg font-medium">Faturaları bırakın · PDF veya zip, birden çok olabilir</p>
        </div>
      )}
      <Button type="button" disabled={progress !== null} onClick={() => input.current?.click()}>
        <Upload />
        {progress ? `Yükleniyor ${progress.done}/${progress.total}…` : "Fatura yükle"}
      </Button>
    </>
  );
}
