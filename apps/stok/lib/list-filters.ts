import { addDays } from "./time";

// Filters for the Müşteriler list. They run in the browser on rows the page already loaded.

type Range = { from?: string; to?: string }; // inclusive YYYY-MM-DD days
const inRange = (d: string, r: Range) => (!r.from || d >= r.from) && (!r.to || d <= r.to);
const monthsBack = (today: string, months: number) => {
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 - months, d));
  return date.toISOString().slice(0, 10);
};

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
