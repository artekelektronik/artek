import { addDays } from "./time";

// Filters for the Faturalar and Müşteriler lists. They run in the browser on rows the page already loaded.

type Range = { from?: string; to?: string }; // inclusive YYYY-MM-DD days
const inRange = (d: string, r: Range) => (!r.from || d >= r.from) && (!r.to || d <= r.to);
const monthsBack = (today: string, months: number) => {
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 - months, d));
  return date.toISOString().slice(0, 10);
};

export const invoiceDatePresets = {
  tumu: "Tüm tarihler",
  bu_ay: "Bu ay",
  son_3_ay: "Son 3 ay",
  bu_yil: "Bu yıl",
  gecen_yil: "Geçen yıl",
  ozel: "Tarih aralığı seç",
} as const;
export type InvoiceDatePreset = keyof typeof invoiceDatePresets;

export function invoiceRange(preset: InvoiceDatePreset, today: string, custom: Range): Range {
  const year = Number(today.slice(0, 4));
  switch (preset) {
    case "bu_ay":
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "son_3_ay":
      return { from: monthsBack(today, 3), to: today };
    case "bu_yil":
      return { from: `${year}-01-01`, to: today };
    case "gecen_yil":
      return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    case "ozel":
      return custom;
    default:
      return {};
  }
}

export type InvoiceFilter = { range: Range; q: string; type: "tumu" | "satis" | "iade" };
export type InvoiceRowLike = { issuedOn: string; number: string; customer: string; type: string; netAmount: string };

export function filterInvoices<T extends InvoiceRowLike>(rows: T[], f: InvoiceFilter): T[] {
  const needle = f.q.trim().toLocaleLowerCase("tr");
  return rows.filter(
    (r) =>
      inRange(r.issuedOn, f.range) &&
      (f.type === "tumu" || (f.type === "iade") === (r.type === "IADE")) &&
      (!needle || `${r.customer} ${r.number}`.toLocaleLowerCase("tr").includes(needle)),
  );
}

// Sales and returns of the rows shown, KDV hariç.
export function invoiceTotals(rows: InvoiceRowLike[]) {
  let sales = 0;
  let returns = 0;
  for (const r of rows) {
    if (r.type === "IADE") returns += Number(r.netAmount);
    else sales += Number(r.netAmount);
  }
  return { sales, returns };
}

export const lastBuyPresets = {
  tumu: "Son alım: hepsi",
  son_3_ay: "Son 3 ayda alanlar",
  bu_yil: "Bu yıl alanlar",
  "6_ay_yok": "6 aydan uzun süredir almayanlar",
  "1_yil_yok": "1 yıldan uzun süredir almayanlar",
  ozel: "Son alım: tarih aralığı seç",
} as const;
export type LastBuyPreset = keyof typeof lastBuyPresets;

export function lastBuyRange(preset: LastBuyPreset, today: string, custom: Range): Range {
  switch (preset) {
    case "son_3_ay":
      return { from: monthsBack(today, 3) };
    case "bu_yil":
      return { from: `${today.slice(0, 4)}-01-01` };
    case "6_ay_yok":
      return { to: addDays(monthsBack(today, 6), -1) };
    case "1_yil_yok":
      return { to: addDays(monthsBack(today, 12), -1) };
    case "ozel":
      return custom;
    default:
      return {};
  }
}

export const contactFilters = {
  tumu: "İletişim: hepsi",
  var: "Telefon veya e-posta var",
  telefon: "Telefonu var",
  eposta: "E-postası var",
  yok: "İletişim bilgisi yok",
} as const;
export type ContactFilter = keyof typeof contactFilters;

export type CustomerFilter = {
  lastBuy: Range;
  status: string; // "" for any
  channel: string; // "" for any
  city: string;
  group: string;
  contact: ContactFilter;
};
export type CustomerRowLike = {
  lastOn: string;
  status: string;
  followUpChannel: string;
  city: string;
  groups: string[];
  phone: string | null;
  email: string | null;
};

const contactMatches = (r: CustomerRowLike, c: ContactFilter) => {
  if (c === "var") return Boolean(r.phone || r.email);
  if (c === "telefon") return Boolean(r.phone);
  if (c === "eposta") return Boolean(r.email);
  if (c === "yok") return !r.phone && !r.email;
  return true;
};

export function filterCustomers<T extends CustomerRowLike>(rows: T[], f: CustomerFilter): T[] {
  return rows.filter(
    (r) =>
      inRange(r.lastOn, f.lastBuy) &&
      (!f.status || r.status === f.status) &&
      (!f.channel || r.followUpChannel === f.channel) &&
      (!f.city || r.city === f.city) &&
      (!f.group || r.groups.includes(f.group)) &&
      contactMatches(r, f.contact),
  );
}
