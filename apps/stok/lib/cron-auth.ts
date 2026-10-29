import { timingSafeEqual } from "node:crypto";

// Vercel Cron sends Authorization: Bearer $CRON_SECRET; without the secret set, nothing gets in.
export function cronAuthorized(request: Request) {
  return bearerMatches(request, process.env.CRON_SECRET);
}

// The sales routines send Authorization: Bearer $ADAYLAR_TOKEN when they add Adaylar.
export function leadsAuthorized(request: Request) {
  return bearerMatches(request, process.env.ADAYLAR_TOKEN);
}

function bearerMatches(request: Request, secret: string | undefined) {
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
