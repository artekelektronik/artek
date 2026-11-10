import assert from "node:assert/strict";
import { before, test } from "node:test";

let formatIstanbulTime: typeof import("./time").formatIstanbulTime;

before(async () => {
  // Run as if the server were elsewhere, so a local-time implementation can't pass by accident.
  process.env.TZ = "America/New_York";
  ({ formatIstanbulTime } = await import("./time"));
});

test("a UTC instant is shown in Turkish as Europe/Istanbul wall time", () => {
  // 21:30 UTC is 00:30 the next day in Istanbul (UTC+3).
  assert.equal(formatIstanbulTime(new Date("2026-10-22T21:30:00Z")), "23 Ekim 2026 00:30");
});

test("a day range from the URL covers whole Istanbul days; a malformed day is ignored", async () => {
  const { dayRange } = await import("./time");
  const range = dayRange({ baslangic: "2026-11-01", bitis: "2026-11-05" });
  assert.equal(range.from?.toISOString(), "2026-10-31T21:00:00.000Z");
  assert.equal(range.to?.toISOString(), "2026-11-05T20:59:59.999Z");
  assert.deepEqual(dayRange({ baslangic: "1 Kasım", bitis: undefined }), { from: undefined, to: undefined });
});
