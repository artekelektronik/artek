"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
export function ProductShare({name}:{name:string}) {
  const t = useTranslations("productDetail");
  const [status,setStatus] = useState("");
  async function copy() {
    try {await navigator.clipboard.writeText(window.location.href); setStatus(t("copied"));}
    catch {setStatus(t("copyFailed"));}
  }
  async function share() {
    if (!navigator.share) return copy();
    try {await navigator.share({title:name,url:window.location.href});}
    catch (error) {if (!(error instanceof DOMException && error.name === "AbortError")) setStatus(t("shareFailed"));}
  }
  return <div className="border-t pt-4"><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={copy}>{t("copyLink")}</Button><Button variant="outline" onClick={share}>{t("share")}</Button></div><p role="status" className="mt-2 text-sm">{status}</p></div>;
}
