import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Cookie-only redirect; the layout and requirePermission verify the session.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) return NextResponse.redirect(new URL("/giris", request.url));
  return NextResponse.next();
}

export const config = {
  // Skips public pages and APIs, Next internals and static files.
  matcher: ["/((?!giris|sifremi-unuttum|sifre-belirle|api/auth|api/cron|api/catalog|api/adaylar|_next|.*\\..*).*)"],
};
