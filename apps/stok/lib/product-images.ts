// Product images are served by the Vitrin (ferritnuve.com); imported products store paths like
// "/products-images/ee-cores.jpg" relative to it. A full URL is used as it is.
const vitrinUrl = process.env.NEXT_PUBLIC_VITRIN_URL || "https://www.ferritnuve.com";

export function productImageUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : new URL(path, vitrinUrl).toString();
}
