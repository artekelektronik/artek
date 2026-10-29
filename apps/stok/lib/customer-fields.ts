import type { CustomerField } from "../db/schema";
import { customerStatusLabels, type CustomerStatus } from "./finance-calc";

// Client-safe: how the change history and note proposals name a Müşteri field and show its value.

export const fieldLabels: Record<CustomerField, string> = {
  name: "Unvan",
  phone: "Telefon",
  email: "E-posta",
  website: "Web sitesi",
  about: "Ne yapıyor",
  status: "Durum",
};

export const sourceLabels = { not: "nottan", fatura: "faturadan", elle: "elle", oneri: "Bugün önerisinden" } as const;

export const fieldValue = (field: CustomerField, value: string | null) =>
  value === null || value === "" ? "boş" : field === "status" ? (customerStatusLabels[value as CustomerStatus] ?? value) : value;
