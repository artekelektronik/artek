// Pure calculations for the Finans and Müşteriler screens; no database, so tests can import it directly.

const tlFormat = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const tlCompact = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });
export const tl = (v: number) => `${tlFormat.format(v)} TL`;
export const tlShort = (v: number) => `${tlCompact.format(v)} TL`;
export const pct = (v: number) => `%${tlFormat.format(v * 100)}`;
export const day = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export const monthLabel = (ym: string) => `${monthNames[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

export const priorities = [
  { no: 1, label: "Geri kazan", hint: "Eskiden düzenliydi, 3 aydır yok" },
  { no: 2, label: "Tekrar getir", hint: "Bir kez büyük aldı, gelmedi" },
  { no: 3, label: "Büyüt", hint: "En iyi 10 müşteri, ek ürün sat" },
  { no: 4, label: "Takipte tut", hint: "Aktif, ilişkiyi sıcak tut" },
  { no: 5, label: "Sonra", hint: "Küçük ve eski, toplu duyuru yeter" },
] as const;
export type Priority = (typeof priorities)[number]["no"];

export type CustomerStats = {
  sales: number;
  invoices: number;
  orderDays: number; // distinct invoice dates; several invoices on one day are one order
  firstOn: string;
  lastOn: string;
  groups: string[]; // by sales, largest first
};

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

// Same rules as the first invoice analysis: lapsed regulars first, then big one-off buyers, then the top 10.
export function priorityOf(s: CustomerStats, rank: number, asOf: string): { no: Priority; talk: string } {
  const idle = daysBetween(s.lastOn, asOf);
  if (s.orderDays >= 2 && idle > 90) {
    return { no: 1, talk: `${s.orderDays} kez aldı, ${idle} gündür yok. Neden ara verdiğini sor: fiyat, teslim süresi, kalite ya da proje bitti mi?` };
  }
  if (s.orderDays === 1 && rank <= 40 && idle > 90) {
    return { no: 2, talk: "Bir kez büyük alım yaptı. Ürün işini gördü mü, yeni proje ya da tekrar sipariş var mı sor." };
  }
  if (rank <= 10) {
    const trafo = s.groups.includes("Özel trafo");
    const nuve = s.groups.includes("Ferrit nüve ve toroid");
    if (trafo && !nuve) return { no: 3, talk: "En iyi müşterilerden. Trafo alıyor: nüve ve bobini de bizden alabilir mi sor." };
    if (nuve && !trafo) return { no: 3, talk: "En iyi müşterilerden. Nüve alıyor: hazır sarılı trafo veya bobin ihtiyacını sor." };
    return { no: 3, talk: "En iyi müşterilerden. Yıllık ihtiyacını ve yaklaşan projelerini sor, düzenli sipariş öner." };
  }
  if (idle <= 90) return { no: 4, talk: "Aktif müşteri. Teslimattan memnun mu sor, ihtiyaç olunca hatırlasın." };
  return { no: 5, talk: "Bir kez küçük alım yaptı. Toplu e-posta veya LinkedIn duyurusu yeterli." };
}

export const loyalty = (orderDays: number) => (orderDays >= 4 ? "Sadık" : orderDays >= 2 ? "Tekrar eden" : "Tek sefer");
export const recency = (idle: number) => (idle <= 90 ? "Aktif" : idle <= 180 ? "Soğuyor" : "Uzun süredir yok");

type InvoiceRow = { id: string; customerId: string; issuedOn: string; netAmount: number };
type LineRow = { invoiceId: string; productName: string; productGroup: string; amount: number; quantity: number };

const legalWords = [" SANAYİ", " SAN.", " SAN ", " TİCARET", " TİC.", " LİMİTED", " LTD", " ANONİM", " A.Ş", " A. Ş", " AŞ", " İTH.", " İTHALAT", " İÇ VE", " DIŞ", " ENDÜSTRİSİ", " İNŞ", " ŞTD"];

// "ÖRNEK MAKİNA SANAYİ VE TİCARET A.Ş" → "ÖRNEK MAKİNA": the name people use, for lists and charts.
export function shortName(name: string) {
  let cut = name.length;
  for (const w of legalWords) {
    const i = name.indexOf(w);
    if (i > 0 && i < cut && name.slice(0, i).trim().length >= 3) cut = i;
  }
  let out = name.slice(0, cut).replace(/[ .,-]+$/, "");
  for (const w of ["SİST.", ".SAN", " PAZ", " MAK."]) {
    const i = out.indexOf(w);
    if (i > 3) out = out.slice(0, i);
  }
  if (out.length > 32) out = out.slice(0, 32).replace(/\s+\S*$/, "");
  return out.replace(/[ .,-]+$/, "");
}

// Everything the Finans and Müşteriler screens show, from sales invoices (IADE left out). Hundreds of rows: plain TS.
export function summarize(invoices: InvoiceRow[], lines: LineRow[], customers: { id: string; city: string }[]) {
  const invoiceById = new Map(invoices.map((i) => [i.id, i]));
  const salesLines = lines.filter((l) => invoiceById.has(l.invoiceId));
  const asOf = invoices.reduce((m, i) => (i.issuedOn > m ? i.issuedOn : m), "");
  const total = invoices.reduce((s, i) => s + i.netAmount, 0);

  const per = new Map<
    string,
    { sales: number; invoices: number; days: Set<string>; firstOn: string; lastOn: string; groups: Map<string, number>; products: Map<string, number> }
  >();
  for (const i of invoices) {
    const c = per.get(i.customerId) ?? {
      sales: 0,
      invoices: 0,
      days: new Set<string>(),
      firstOn: i.issuedOn,
      lastOn: i.issuedOn,
      groups: new Map<string, number>(),
      products: new Map<string, number>(),
    };
    c.sales += i.netAmount;
    c.invoices += 1;
    c.days.add(i.issuedOn);
    if (i.issuedOn < c.firstOn) c.firstOn = i.issuedOn;
    if (i.issuedOn > c.lastOn) c.lastOn = i.issuedOn;
    per.set(i.customerId, c);
  }
  for (const l of salesLines) {
    const c = per.get(invoiceById.get(l.invoiceId)!.customerId)!;
    c.groups.set(l.productGroup, (c.groups.get(l.productGroup) ?? 0) + l.amount);
    c.products.set(l.productName, (c.products.get(l.productName) ?? 0) + l.amount);
  }
  const ranked = [...per.entries()]
    .map(([customerId, c]) => ({
      customerId,
      sales: c.sales,
      invoices: c.invoices,
      orderDays: c.days.size,
      firstOn: c.firstOn,
      lastOn: c.lastOn,
      groups: [...c.groups.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g),
      topProduct: [...c.products.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "",
    }))
    .sort((a, b) => b.sales - a.sales)
    .map((c, i) => ({ ...c, rank: i + 1, idle: daysBetween(c.lastOn, asOf), ...priorityOf(c, i + 1, asOf) }));
  const byCustomer = new Map(ranked.map((c) => [c.customerId, c]));

  const months = new Map<string, { sales: number; invoices: number; customers: Set<string> }>();
  for (const i of invoices) {
    const ym = i.issuedOn.slice(0, 7);
    const m = months.get(ym) ?? { sales: 0, invoices: 0, customers: new Set() };
    m.sales += i.netAmount;
    m.invoices += 1;
    m.customers.add(i.customerId);
    months.set(ym, m);
  }
  const monthly = [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, m]) => ({
      month: ym,
      sales: m.sales,
      invoices: m.invoices,
      customers: m.customers.size,
      newCustomers: ranked.filter((c) => c.firstOn.slice(0, 7) === ym).length,
    }));

  const groupMap = new Map<string, { sales: number; invoices: Set<string>; customers: Set<string> }>();
  const productMap = new Map<string, { group: string; sales: number; quantity: number; invoices: Set<string>; customers: Set<string> }>();
  for (const l of salesLines) {
    const cid = invoiceById.get(l.invoiceId)!.customerId;
    const g = groupMap.get(l.productGroup) ?? { sales: 0, invoices: new Set(), customers: new Set() };
    g.sales += l.amount;
    g.invoices.add(l.invoiceId);
    g.customers.add(cid);
    groupMap.set(l.productGroup, g);
    const p = productMap.get(l.productName) ?? { group: l.productGroup, sales: 0, quantity: 0, invoices: new Set(), customers: new Set() };
    p.sales += l.amount;
    p.quantity += l.quantity;
    p.invoices.add(l.invoiceId);
    p.customers.add(cid);
    productMap.set(l.productName, p);
  }
  const lineTotal = salesLines.reduce((s, l) => s + l.amount, 0);
  const groups = [...groupMap.entries()]
    .map(([group, g]) => ({ group, sales: g.sales, share: lineTotal ? g.sales / lineTotal : 0, invoices: g.invoices.size, customers: g.customers.size }))
    .sort((a, b) => b.sales - a.sales);
  const products = [...productMap.entries()]
    .map(([name, p]) => ({ name, group: p.group, sales: p.sales, quantity: p.quantity, invoices: p.invoices.size, customers: p.customers.size }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 30);

  const share = (n: number) => (total ? ranked.slice(0, n).reduce((s, c) => s + c.sales, 0) / total : 0);
  const repeat = ranked.filter((c) => c.orderDays >= 2);
  const lapsed = ranked.filter((c) => c.no === 1);
  const coreBuyers = ranked.filter((c) => c.groups.includes("Ferrit nüve ve toroid"));
  const cityOf = new Map(customers.map((c) => [c.id, c.city]));
  const cities = new Map<string, number>();
  for (const c of ranked) cities.set(cityOf.get(c.customerId) || "Bilinmiyor", (cities.get(cityOf.get(c.customerId) || "Bilinmiyor") ?? 0) + 1);

  return {
    asOf,
    firstOn: invoices.reduce((m, i) => (!m || i.issuedOn < m ? i.issuedOn : m), ""),
    total,
    invoiceCount: invoices.length,
    customerCount: ranked.length,
    repeatCount: repeat.length,
    repeatShare: total ? repeat.reduce((s, c) => s + c.sales, 0) / total : 0,
    customers: ranked,
    byCustomer,
    monthly,
    groups,
    products,
    cities: [...cities.entries()].sort((a, b) => b[1] - a[1]).map(([city, count]) => ({ city, count })),
    insights: {
      top1: share(1),
      top5: share(5),
      top20: share(20),
      oneOff: ranked.length ? ranked.filter((c) => c.orderDays === 1).length / ranked.length : 0,
      lapsedCount: lapsed.length,
      lapsedSales: lapsed.reduce((s, c) => s + c.sales, 0),
      trafoShare: groups.find((g) => g.group === "Özel trafo")?.share ?? 0,
      trafoCustomers: groups.find((g) => g.group === "Özel trafo")?.customers ?? 0,
      coreCustomers: coreBuyers.length,
      coreAlsoTrafo: coreBuyers.length ? coreBuyers.filter((c) => c.groups.includes("Özel trafo")).length / coreBuyers.length : 0,
    },
  };
}

// Gaps in each invoice series (e-Fatura and e-Arşiv count separately): invoices not uploaded yet, or cancelled.
export function missingNumbers(rows: { number: string; scenario: string; issuedOn: string }[]) {
  const series = new Map<string, { n: number; issuedOn: string }[]>();
  for (const r of rows) {
    const m = /^([A-Z]{3})(\d{4})(\d{9})$/.exec(r.number);
    if (!m) continue;
    const key = `${r.scenario === "EARSIVFATURA" ? "e-Arşiv" : "e-Fatura"} ${m[2]}`;
    series.set(key, [...(series.get(key) ?? []), { n: Number(m[3]), issuedOn: r.issuedOn }]);
  }
  const gaps: { series: string; from: number; to: number; after: string; before: string }[] = [];
  for (const [key, list] of [...series].sort(([a], [b]) => a.localeCompare(b))) {
    list.sort((a, b) => a.n - b.n);
    for (let i = 1; i < list.length; i++) {
      if (list[i].n - list[i - 1].n > 1) {
        gaps.push({ series: key, from: list[i - 1].n + 1, to: list[i].n - 1, after: list[i - 1].issuedOn, before: list[i].issuedOn });
      }
    }
  }
  return gaps;
}

// Mirrors the customer_status enum in db/schema.ts; kept here so client forms don't pull in the database.
export const customerStatusLabels = {
  aranacak: "Aranacak",
  arandi: "Arandı",
  ulasilamadi: "Ulaşılamadı",
  teklif_verildi: "Teklif verildi",
  siparis_geldi: "Sipariş geldi",
  ilgilenmiyor: "İlgilenmiyor",
} as const;
export type CustomerStatus = keyof typeof customerStatusLabels;
