import fs from "fs";
import path from "path";
import type { AirtableProduct, AirtableAttachment, ProductFields } from "@/types/airtable";

const CSV_PATH = path.join(process.cwd(), "lib", "Products.csv");

/** Parse a CSV file that may contain quoted multi-line fields */
function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        // Escaped quote
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        cell = "";
        rows.push(row);
        row = [];
      } else if (ch === "\r") {
        // skip carriage return
      } else {
        cell += ch;
      }
    }
  }
  // Last cell/row
  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Extract URL from Airtable CSV photo cell: "filename.png (https://...)" */
function parsePhoto(raw: string): AirtableAttachment[] {
  if (!raw?.trim()) return [];
  // Format: "name.ext (url)" — possibly multiple separated by comma outside parens
  const matches = [...raw.matchAll(/([^(,]+)\s*\((https?:\/\/[^)]+)\)/g)];
  if (!matches.length) return [];
  return matches.map((m, idx) => ({
    id: `csv-photo-${idx}`,
    url: m[2].trim(),
    filename: m[1].trim(),
    size: 0,
    type: "image/jpeg",
  }));
}

/** Parse price string like "$1.00" or "1.50" → number */
function parsePrice(raw: string): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = parseFloat(raw.replace(/[$,]/g, "").trim());
  return isNaN(n) ? undefined : n;
}

/** Parse int or undefined */
function parseInt2(raw: string): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = parseInt(raw.replace(/[$,]/g, "").trim(), 10);
  return isNaN(n) ? undefined : n;
}

/** Split a multi-value cell (comma-separated) into an array, or undefined if empty */
function splitMulti(raw: string): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

/** Generate a stable fake Airtable record ID from index */
function fakeRecordId(index: number): string {
  return "rec" + String(index).padStart(14, "0");
}

let _cache: AirtableProduct[] | null = null;

export function getProductsFromCSV(): AirtableProduct[] {
  if (_cache) return _cache;

  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(raw);

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());

  const products: AirtableProduct[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c.trim())) continue;

    const get = (col: string) => (row[headers.indexOf(col)] ?? "").trim();

    const productName = get("Product Name");
    if (!productName) continue;

    const fields: ProductFields = {
      "Product Name": productName,
      "Product Code": get("Product Code") || undefined,
      Category: get("Category") || undefined,
      "Alt Kategori": splitMulti(get("Alt Kategori")),
      "Ürün Tipi": splitMulti(get("Ürün Tipi")),
      Description: get("Description") || undefined,
      Photo: parsePhoto(get("Photo")),
      "Unit Price": parsePrice(get("Unit Price")),
      "Alış Fiyatı": parsePrice(get("Alış Fiyatı")),
      "Toptan Fiyatı": parsePrice(get("Toptan Fiyatı")),
      "Parakende Fiyatı": parsePrice(get("Parakende Fiyatı")),
      "Toptan Taban ": parsePrice(get("Toptan Taban ")),
      "Stock Quantity": parseInt2(get("Stock Quantity")),
      "Stock (Karakoy)": parseInt2(get("Stock (Karakoy)")),
      "Stock (Cekmekoy)": parseInt2(get("Stock (Cekmekoy)")),
      "Total Stock Value": parsePrice(get("Total Stock Value")),
      Supplier: splitMulti(get("Supplier")),
      "Supplier Country": splitMulti(get("Supplier Country")),
      Manufacturer: splitMulti(get("Manufacturer")),
    };

    products.push({
      id: fakeRecordId(i),
      fields,
      createdTime: new Date().toISOString(),
    });
  }

  _cache = products;
  return products;
}
