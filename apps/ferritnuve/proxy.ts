import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const middleware = createMiddleware(routing);
const articleMiddleware = createMiddleware({...routing, localeDetection: false, alternateLinks: false});

export default function proxy(request: NextRequest) {
  return /^\/(?:(?:tr|en)\/)?blog\/[^/]+\/?$/.test(request.nextUrl.pathname)
    ? articleMiddleware(request)
    : middleware(request);
}

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/...)
  // - Next.js internals (/_next/...)
  // - Static files (favicon.ico, etc.)
  matcher: ["/((?!api|trpc|_next|_vercel|icon(?:/|$)|apple-icon(?:/|$)|.*\\..*).*)"],
};
