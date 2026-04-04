import { headers } from "next/headers";

const DEFAULT_SITE_URL = "https://www.ferritnuve.com";

export async function getSiteUrl() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");

  if (host) {
    const forwardedProto = requestHeaders.get("x-forwarded-proto");
    const protocol = forwardedProto ?? (host.includes("localhost") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
}

export function getLocalizedPath(locale: string, path = "") {
  if (locale === "tr") {
    return path || "/";
  }

  if (!path) {
    return "/en";
  }

  return `/en${path}`;
}

export function getLanguageAlternates(siteUrl: string, path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const rootPath = path ? normalizedPath : "";

  return {
    "x-default": `${siteUrl}${rootPath}`,
    tr: `${siteUrl}${rootPath}`,
    en: `${siteUrl}/en${rootPath}`,
  };
}

export function getOgImageUrl(siteUrl: string, locale: string) {
  return `${siteUrl}${getLocalizedPath(locale, "/opengraph-image")}`;
}

export function getTwitterImageUrl(siteUrl: string, locale: string) {
  return `${siteUrl}${getLocalizedPath(locale, "/twitter-image")}`;
}
