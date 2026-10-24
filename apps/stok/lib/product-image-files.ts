import { del } from "@vercel/blob";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { product } from "../db/schema";

const isBlobUrl = (url: string) => /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(url);

// The Blob images among `urls` that no product shows any more (imported products share files).
export async function unusedBlobImages(urls: string[]) {
  const candidates = [...new Set(urls.filter(isBlobUrl))];
  if (!candidates.length) return [];
  const list = sql`array[${sql.join(
    candidates.map((url) => sql`${url}`),
    sql`, `,
  )}]::text[]`;
  const { rows } = await db.execute<{ url: string }>(
    sql`select distinct unnest(${product.images}) as url from ${product} where ${product.images} && ${list}`,
  );
  const stillUsed = new Set(rows.map((r) => r.url));
  return candidates.filter((url) => !stillUsed.has(url));
}

// Best effort after a save: a failure only leaves an unused file in Blob.
export async function deleteUnusedImages(urls: string[]) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    const unused = await unusedBlobImages(urls);
    if (unused.length) await del(unused);
  } catch (error) {
    console.error("[gorsel] silinemedi:", urls, error);
  }
}
