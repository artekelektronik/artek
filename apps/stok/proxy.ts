import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Fast redirect for visitors without a session cookie. The (app) layout and
// requirePermission still check the session itself on the server.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) return NextResponse.redirect(new URL("/giris", request.url));
  return NextResponse.next();
}

export const config = {
  // Everything except the login page, API routes (each checks access itself), Next.js internals and static files.
  matcher: ["/((?!giris|api/|_next|.*\\..*).*)"],
};
