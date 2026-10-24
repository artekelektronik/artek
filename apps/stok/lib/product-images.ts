// Old imports store paths relative to the Vitrin; full URLs (Blob) are used as is.
const vitrinUrl = process.env.NEXT_PUBLIC_VITRIN_URL || "https://www.ferritnuve.com";

export function productImageUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : new URL(path, vitrinUrl).toString();
}
