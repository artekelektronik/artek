import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/...)
  // - Next.js internals (/_next/...)
  // - Static files (favicon.ico, etc.)
  matcher: ["/((?!api|trpc|_next|_vercel|icon(?:/|$)|apple-icon(?:/|$)|.*\\..*).*)"],
};
