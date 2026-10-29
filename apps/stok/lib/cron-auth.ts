import { timingSafeEqual } from "node:crypto";

// Vercel Cron sends Authorization: Bearer $CRON_SECRET; without the secret set, nothing gets in.
export function cronAuthorized(request: Request) {
  return bearerMatches(request, process.env.CRON_SECRET);
}

// The sales routines send Authorization: Bearer $ADAYLAR_TOKEN when they add Adaylar.
export function leadsAuthorized(request: Request) {
  return bearerMatches(request, process.env.ADAYLAR_TOKEN);
}

// A pasted secret may carry a stray space or line break; it never belongs to the value.
function bearerMatches(request: Request, raw: string | undefined) {
  const secret = raw?.trim();
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
