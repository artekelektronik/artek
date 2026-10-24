import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Fast redirect for visitors without a session cookie. The (app) layout and
// requirePermission still check the session itself on the server.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) return NextResponse.redirect(new URL("/giris", request.url));
  return NextResponse.next();
}

export const config = {
  // Everything except the login, forgot-password and set-password pages, the auth API and the cron route (each checks
  // access itself), the public catalog, Next.js internals and static files.
  matcher: ["/((?!giris|sifremi-unuttum|sifre-belirle|api/auth|api/cron|api/catalog|_next|.*\\..*).*)"],
};
