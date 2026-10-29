// How an Aday's name is compared: with other Adaylar to find repeats, and with Müşteriler to see who became one.

// Legal and generic words that differ between how a report and an invoice write the same firm.
const filler = new Set([
  "a", "ş", "as", "aş", "anonim", "ltd", "şti", "sti", "limited", "şirketi", "sirketi", "şirket",
  "san", "sanayi", "sanayii", "tic", "ticaret", "ve", "ith", "ihr", "ithalat", "ihracat", "paz", "pazarlama", "inc", "co",
]);

export function normFirm(name: string) {
  return name
    .toLocaleLowerCase("tr")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((w) => w && !filler.has(w))
    .join(" ");
}

// The Müşteri an Aday most likely became: the only one whose cleaned name equals it or starts with it (or the
// other way round). A person confirms it; nothing is linked on a name alone.
export function likelyCustomer<C extends { id: string; name: string }>(leadName: string, customers: C[]) {
  const core = normFirm(leadName);
  if (core.length < 3) return null;
  const hits = customers.filter((c) => {
    const n = normFirm(c.name);
    return n === core || n.startsWith(`${core} `) || core.startsWith(`${n} `);
  });
  return hits.length === 1 ? hits[0] : null;
}
