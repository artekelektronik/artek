import { timingSafeEqual } from "node:crypto";

// Vercel Cron sends Authorization: Bearer $CRON_SECRET; without the secret set, nothing gets in.
export function cronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
