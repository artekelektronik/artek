import assert from "node:assert/strict";
import { test } from "node:test";

// Run as if the server were elsewhere, so a local-time implementation can't pass by accident.
process.env.TZ = "America/New_York";

const { formatIstanbulTime } = await import("./time.ts");

test("a UTC instant is shown in Turkish as Europe/Istanbul wall time", () => {
  // 21:30 UTC is 00:30 the next day in Istanbul (UTC+3).
  assert.equal(formatIstanbulTime(new Date("2026-10-22T21:30:00Z")), "23 Ekim 2026 00:30");
});
