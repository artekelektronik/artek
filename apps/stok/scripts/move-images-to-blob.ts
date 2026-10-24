// One-time copy of Vitrin-hosted images into Blob, repointing products; re-runnable.
// Usage: pnpm --filter stok move-images-to-blob   (needs DATABASE_URL and BLOB_READ_WRITE_TOKEN)
import path from "node:path";
import { put } from "@vercel/blob";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { product } from "../db/schema";
import { productImageUrl } from "../lib/product-images";

async function moveImagesToBlob() {
  const { rows } = await db.execute<{ path: string }>(
    sql`select distinct unnest(${product.images}) as path from ${product}`,
  );
  const paths = rows.map((r) => r.path).filter((p) => !/^https?:\/\//.test(p));
  let copied = 0;
  for (const original of paths) {
    const response = await fetch(productImageUrl(original));
    if (!response.ok) throw new Error(`${original} indirilemedi: ${response.status}`);
    const blob = await put(`urunler/${path.basename(original)}`, await response.arrayBuffer(), {
      access: "public",
      addRandomSuffix: true,
      contentType: response.headers.get("content-type") ?? undefined,
    });
    await db.execute(sql`update ${product} set images = array_replace(${product.images}, ${original}, ${blob.url})`);
    copied++;
  }
  return { copied };
}

async function main() {
  const { copied } = await moveImagesToBlob();
  console.log(`Görseller: ${copied} dosya Blob'a kopyalandı.`);
  await db.$client.end();
}

if (require.main === module) {
  main().catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await db.$client.end();
    process.exit(1);
  });
}
