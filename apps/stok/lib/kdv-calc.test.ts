import assert from "node:assert/strict";
import { test } from "node:test";
import { kdvBetween, monthlyKdv } from "./kdv-calc";

const sale = (day: string, net: string, total: string, isReturn = false) => ({ day, netAmount: net, totalAmount: total, isReturn });
const spent = (day: string, net: string, total: string) => ({ day, netAmount: net, totalAmount: total });

test("sales KDV less Gider KDV per month; an iade's KDV comes off", () => {
  const months = monthlyKdv(
    [sale("2026-10-03", "1000", "1200"), sale("2026-10-20", "500", "600", true), sale("2026-11-01", "100", "100")],
    [spent("2026-10-05", "300", "360"), spent("2026-09-30", "50", "60")],
  );
  assert.deepEqual(months, [
    { month: "2026-09", sales: 0, expenses: 10, payable: -10 },
    { month: "2026-10", sales: 100, expenses: 60, payable: 40 },
    { month: "2026-11", sales: 0, expenses: 0, payable: 0 },
  ]);
});

test("kdvBetween adds up whole months in the range", () => {
  const months = monthlyKdv([sale("2026-08-10", "100", "120"), sale("2026-09-10", "100", "120"), sale("2026-11-10", "100", "120")], []);
  assert.deepEqual(kdvBetween(months, "2026-08-01", "2026-10-31"), { sales: 40, expenses: 0, payable: 40 });
});
