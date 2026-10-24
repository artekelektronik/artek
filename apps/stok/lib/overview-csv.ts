import type { Overview } from "./overview";
import { unitLabels } from "./quantity";

// Excel in Turkish locale: ";" between columns, "," as decimal separator, and a UTF-8 BOM so
// characters like ğ, ş and İ open correctly.
const quantity = (value: string) => value.replace(".", ",");

function text(value: string) {
  // A cell starting with = + - @ (or a tab or carriage return) would run as a formula in Excel.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(overview: Overview) {
  const header = [
    "Kod",
    "Ürün",
    "Kategori",
    "Birim",
    ...overview.lokasyon.flatMap((l) => [`${l.name} fiziksel`, `${l.name} ayrılmış`, `${l.name} kullanılabilir`]),
    "Yolda",
    "Toplam",
  ];
  const lines = overview.rows.map((row) => [
    text(row.code),
    text(row.name),
    text(row.category),
    unitLabels[row.unit],
    ...overview.lokasyon.flatMap((l) => [
      quantity(row.stock[l.id].physical),
      quantity(row.stock[l.id].reserved),
      quantity(row.stock[l.id].available),
    ]),
    quantity(row.inTransit),
    quantity(row.total),
  ]);
  return "﻿" + [header.map(text), ...lines].map((cells) => cells.join(";")).join("\r\n") + "\r\n";
}
