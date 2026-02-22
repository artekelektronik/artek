/**
 * Script: download-products.mjs
 * Downloads product images from the CSV and builds a local products.json
 *
 * Usage: node scripts/download-products.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CSV_PATH = path.join(ROOT, "lib", "Products.csv");
const IMAGES_DIR = path.join(ROOT, "public", "products-images");
const OUTPUT_JSON = path.join(ROOT, "lib", "products.json");

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseCSV(raw) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
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
        // skip
      } else {
        cell += ch;
      }
    }
  }
  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "Screenshot 2025-10-31 at 9.10.59 AM.png (https://...)" → { filename, url } */
function parsePhoto(raw) {
  if (!raw?.trim()) return null;
  const match = raw.match(/^(.+?)\s*\((https?:\/\/.+)\)$/s);
  if (!match) return null;
  return { filename: match[1].trim(), url: match[2].trim() };
}

/** Sanitize a filename for local use: lowercase, spaces → dashes, remove special chars */
function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-");
}

function parsePrice(raw) {
  if (!raw?.trim()) return undefined;
  const n = parseFloat(raw.replace(/[$,]/g, "").trim());
  return isNaN(n) ? undefined : n;
}

function parseIntVal(raw) {
  if (!raw?.trim()) return undefined;
  const n = parseInt(raw.replace(/[$,]/g, "").trim(), 10);
  return isNaN(n) ? undefined : n;
}

// ─── Download ─────────────────────────────────────────────────────────────────

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buf));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // Strip UTF-8 BOM if present
  let raw = fs.readFileSync(CSV_PATH, "utf-8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const rows = parseCSV(raw);

  if (rows.length < 2) {
    console.error("CSV is empty or only has a header row");
    process.exit(1);
  }

  const headers = rows[0];
  const photoIdx = headers.indexOf("Photo");

  // Column indices
  const col = (name) => headers.indexOf(name);

  // Track already-downloaded filenames to avoid re-downloading the same image
  const downloadedMap = new Map(); // originalFilename → localFilename

  const products = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.every((c) => !c.trim())) continue; // skip blank rows

    const photoRaw = r[photoIdx] ?? "";
    const photo = parsePhoto(photoRaw);

    let localImage = null;

    if (photo) {
      const sanitized = sanitizeFilename(photo.filename);

      if (downloadedMap.has(photo.filename)) {
        // Reuse already-downloaded file
        localImage = `/products-images/${downloadedMap.get(photo.filename)}`;
      } else {
        // Need to download
        const destPath = path.join(IMAGES_DIR, sanitized);

        if (fs.existsSync(destPath)) {
          console.log(`  ↩  Already exists: ${sanitized}`);
        } else {
          process.stdout.write(`  ↓  Downloading ${sanitized} … `);
          try {
            await downloadImage(photo.url, destPath);
            console.log("OK");
          } catch (err) {
            console.log(`FAILED (${err.message})`);
            localImage = null;
          }
        }

        if (!localImage) {
          downloadedMap.set(photo.filename, sanitized);
          localImage = `/products-images/${sanitized}`;
        }
      }
    }

    const product = {
      id: `product-${i}`,
      name: r[col("Product Name")]?.trim() ?? "",
      productCode: r[col("Product Code")]?.trim() || undefined,
      category: r[col("Category")]?.trim() || undefined,
      productType: r[col("Ürün Tipi")]?.trim() || undefined,
      subCategory: r[col("Alt Kategori")]?.trim() || undefined,
      description: r[col("Description")]?.trim() || undefined,
      image: localImage,
      pricing: {
        unitPrice: parsePrice(r[col("Unit Price")]),
        purchasePrice: parsePrice(r[col("Alış Fiyatı")]),
        wholesalePrice: parsePrice(r[col("Toptan Fiyatı")]),
        retailPrice: parsePrice(r[col("Parakende Fiyatı")]),
        wholesaleBase: parsePrice(r[col("Toptan Taban ")]),
      },
      stock: {
        total: parseIntVal(r[col("Stock Quantity")]),
        karakoy: parseIntVal(r[col("Stock (Karakoy)")]),
        cekmekoy: parseIntVal(r[col("Stock (Cekmekoy)")]),
      },
      supplier: r[col("Supplier")]?.trim() || undefined,
      manufacturer: r[col("Manufacturer")]?.trim() || undefined,
      supplierCountry: r[col("Supplier Country")]?.trim() || undefined,
      totalStockValue: parsePrice(r[col("Total Stock Value")]),
    };

    products.push(product);
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(products, null, 2), "utf-8");

  console.log(`\n✅  Done!`);
  console.log(`   • ${products.length} products written to lib/products.json`);
  console.log(`   • Images saved to public/products-images/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
