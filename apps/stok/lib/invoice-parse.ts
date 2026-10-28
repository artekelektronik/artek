// Reads the text of a GİB e-Fatura / e-Arşiv PDF (as QNB Dijital Köprü prints it) into an invoice.
// Pure functions only: the upload route extracts the text, this file turns it into data.

export type ParsedLine = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
};

export type ParsedInvoice = {
  ettn: string;
  number: string;
  issuedOn: string; // YYYY-MM-DD
  scenario: string; // TEMELFATURA (e-Fatura) or EARSIVFATURA (e-Arşiv)
  type: string; // SATIS, IADE, ISTISNA …
  netAmount: number; // Vergi Hariç Tutar
  totalAmount: number; // Vergiler Dahil Toplam Tutar
  buyer: { name: string; taxId: string; taxIdType: "VKN" | "TCKN"; city: string; district: string; email: string | null };
  lines: ParsedLine[];
  linesMatchTotal: boolean;
};

export class InvoiceParseError extends Error {}

const flat = (s: string) => s.replace(/\s+/g, " ").trim();
// 1.234,56 → 1234.56
const amount = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

const addressStart =
  /(MAH|CAD|SOK|SK\.|SK |NO:|BULV|OSB|O\.S\.B|SİT|BLOK|KAT |APT|PLAZA|TEKNOPARK|KÜME|YOLU|ÇARŞI|^\d|SOKAK|CADDE|MAHALLE|KM)/i;
const legalSuffix = /(ŞİRKETİ|ŞTİ|A\.\s?Ş|\bAŞ)\.?(?=\s|$)/;
const lineItem =
  /(?:^|\s)(\d{1,3})\s+(.+?)\s+([\d.,]+)\s*([A-Za-zÇĞİÖŞÜçğıöşü]+\.?)\s+([\d.,]+)\s*TL\s+([\d.,]+)\s*TL\s+(?:%\s*[\d,]+\s+[\d.,]+\s*TL|\d{3}\s*-)/g;

export function parseInvoiceText(raw: string): ParsedInvoice {
  const text = raw.replace(/[ \t]+/g, " ");
  const f = flat(text);
  if (f.length < 50) throw new InvoiceParseError("PDF içinde okunabilir yazı yok (taranmış ya da görsel dosya).");

  const field = (re: RegExp) => re.exec(f)?.[1]?.trim() ?? null;
  const ettn = field(/ETTN:\s*([0-9A-Fa-f-]{36})/);
  const number = field(/Fatura No:\s*(\S+)/);
  const date = field(/Tarih:\s*(\d\d-\d\d-\d{4})/);
  const net = field(/Vergi Hariç Tutar:\s*([\d.,]+)/);
  if (!ettn || !number || !date || !net) throw new InvoiceParseError("Fatura bilgileri okunamadı (ETTN, numara, tarih veya tutar yok).");
  const total = field(/Vergiler Dahil Toplam Tutar:\s*([\d.,]+)/);
  const [d, m, y] = date.split("-");

  // Buyer: between SAYIN and the first Vergi Dairesi / VKN / TCKN after it.
  const at = text.indexOf("SAYIN");
  if (at < 0) throw new InvoiceParseError("Alıcı bilgisi (SAYIN) bulunamadı.");
  const afterSayin = text.slice(at + 5);
  const end = afterSayin.search(/Vergi Dairesi:|VKN:|TCKN:/);
  const block = end >= 0 ? afterSayin.slice(0, end) : "";
  const nameLines: string[] = [];
  for (const line of block.split("\n").map(flat).filter(Boolean)) {
    if (nameLines.length && addressStart.test(line)) break;
    nameLines.push(line);
  }
  let name = nameLines.join(" ");
  const suffix = legalSuffix.exec(name);
  if (suffix) name = name.slice(0, suffix.index + suffix[0].length);
  name = name.replace(/[ .]+$/, "");

  const places = [...flat(block).matchAll(/([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ .]*?)\s*\/\s*([A-ZÇĞİÖŞÜ.]+)/g)];
  const last = places.at(-1);
  const city = last ? ({ ISTANBUL: "İSTANBUL", "K.MARAŞ": "KAHRAMANMARAŞ" }[last[2]] ?? last[2]) : "";
  const district = last ? flat(last[1]).split(" ").at(-1)! : "";
  const id = /(VKN|TCKN):\s*(\d+)/.exec(afterSayin);
  if (!id) throw new InvoiceParseError("Alıcının VKN / TCKN bilgisi bulunamadı.");
  const buyerArea = flat(text.slice(at, text.indexOf("ETTN")));
  const email = /([\w.+-]+@[\w-]+\.[\w.]+)/.exec(buyerArea)?.[1] ?? null;

  // Lines: after the table header, before the bank details or the notes.
  const tableStart = f.indexOf("Sıra");
  let body = f.slice(tableStart >= 0 ? tableStart : 0);
  const header = body.search(/KDV Tutarı|Sebebi/);
  body = header >= 0 ? body.slice(header) : body;
  for (const stop of [" QNB", " İBAN", " * "]) {
    const i = body.indexOf(stop);
    if (i >= 0) body = body.slice(0, i);
  }
  const lines: ParsedLine[] = [];
  for (const match of body.matchAll(lineItem)) {
    let description = flat(match[2]);
    let quantity = amount(match[3]);
    const unitPrice = amount(match[5]);
    const lineAmount = amount(match[6]);
    // A size in the name can run into the quantity ("FERRİT NÜVE(6 MM) 6 40,0"): trust amount ÷ price.
    if (unitPrice && Math.abs(quantity * unitPrice - lineAmount) > 1) {
      quantity = Math.round((lineAmount / unitPrice) * 100) / 100;
      description = description.replace(/\s+\d+$/, "");
    }
    lines.push({ description, quantity, unit: match[4], unitPrice, amount: lineAmount });
  }
  const netAmount = amount(net);

  return {
    ettn: ettn.toLowerCase(),
    number,
    issuedOn: `${y}-${m}-${d}`,
    scenario: field(/Senaryo:\s*(\S+)/) ?? "",
    type: field(/Fatura Tipi:\s*(\S+)/) ?? "",
    netAmount,
    totalAmount: total ? amount(total) : netAmount,
    buyer: { name, taxId: id[2], taxIdType: id[1] as "VKN" | "TCKN", city, district, email },
    lines,
    linesMatchTotal: Math.abs(lines.reduce((s, l) => s + l.amount, 0) - netAmount) <= 1,
  };
}

// The same product is typed many ways on invoices (FERİT NÜVE, FERRİTNUVE …); this is the name we group by.
export function productName(description: string) {
  let u = flat(description.toLocaleUpperCase("tr"));
  u = u.replace(/^(FER+[İI]T ?N[ÜU]VE|FER+[İI]N[ÜU]VE|FER'T N\]VE\*?|FER[İI]T ÇUBUK)/, (m) =>
    m.includes("ÇUBUK") ? "FERRİT NÜVE ÇUBUK" : "FERRİT NÜVE",
  );
  u = u.replace(/^BAKIR ?SARA?GI?L ?I/, "BAKIR SARGILI");
  u = u.replace(/F[İI]L ?[İI]?TRE/g, "FİLTRE");
  u = u.replace("BOBOİN", "BOBİN").replace("TRAF O", "TRAFO").replace("VOL TAJ", "VOLTAJ").replace("KAL EM", "KALEM");
  u = u.replace(/D[İI]RENC/g, "DİRENÇ");
  u = u.replace(/\(\s*/g, "(").replace(/\s*\)/g, ")").replace(/ART-\s+/g, "ART-").replace(/\s*\(/g, "(");
  return u;
}

export const productGroups = [
  "Özel trafo",
  "Ferrit nüve ve toroid",
  "Bobin ve filtre",
  "Diğer komponentler",
  "Tel ve bant",
  "Karkas",
] as const;
export type ProductGroup = (typeof productGroups)[number];

export function productGroup(description: string): ProductGroup {
  const c = description.toLocaleUpperCase("tr").replace(/\s/g, "");
  if (["LİTZ", "BAKIRTEL", "BANT", "BANDI"].some((k) => c.includes(k))) return "Tel ve bant";
  if (c.startsWith("KARKAS") || c.includes("TRİFAZEKARKAS")) return "Karkas";
  if (["SARGI", "SARAGI", "SARGL", "BESLEMETR", "TOROİDALTRAFO", "TR10VA", "10VATRAFO", "AKIMTRAFOSU"].some((k) => c.includes(k))) {
    return c.includes("TRAFO") ? "Özel trafo" : "Bobin ve filtre";
  }
  if (["NUVE", "NÜVE", "FERRİT", "FERİT", "FER'T", "KOOLMU", "TOROİD(", "HPR("].some((k) => c.includes(k))) return "Ferrit nüve ve toroid";
  return "Diğer komponentler";
}
