import type { CustomerField, LinkType } from "../db/schema";
import { customerStatusLabels, type CustomerStatus } from "./finance-calc";

// Client-safe: how the change history and note proposals name a Müşteri field and show its value.

export const fieldLabels: Record<CustomerField, string> = {
  name: "Unvan",
  phone: "Telefon",
  email: "E-posta",
  website: "Web sitesi",
  about: "Ne yapıyor",
  status: "Durum",
  link: "Bağlantı",
};

export const sourceLabels = { not: "nottan", fatura: "faturadan", elle: "elle", oneri: "Takipler önerisinden" } as const;

export const fieldValue = (field: CustomerField, value: string | null) =>
  value === null || value === "" ? "boş" : field === "status" ? (customerStatusLabels[value as CustomerStatus] ?? value) : value;

// How a link reads on each card: on the "from" firm's card and on the "to" firm's card.
export const linkLabels: Record<LinkType, { from: string; to: string }> = {
  satildi: { from: "Satıldı / devredildi", to: "Devraldı" },
  unvan_degisti: { from: "Yeni firması", to: "Önceki firması" },
  birlikte_calisiyor: { from: "Birlikte çalışıyor", to: "Birlikte çalışıyor" },
  ayni_sahip: { from: "Aynı sahip / grup", to: "Aynı sahip / grup" },
  musterimizin_musterisi: { from: "Şu firmadan alıyor", to: "Müşterisi" },
  diger: { from: "İlişkili", to: "İlişkili" },
};
