import { company } from "./company";
const subjects = {
  product: {tr: "Bu ürün hakkında bilgi alın", en: "Enquire about this product"},
  guide: {tr: "Teklif talebi", en: "Quote request"},
};
export function inquiryLinks(name: string, code: string | undefined, url: string, locale: string, kind: keyof typeof subjects = "product") {
  const subject = subjects[kind][locale === "en" ? "en" : "tr"];
  const body = `${subject}\n${name}${code ? `\n${locale === "en" ? "Code" : "Kod"}: ${code}` : ""}\n${url}`;
  return {
    whatsapp: `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(body)}`,
    email: `mailto:${company.email}?subject=${encodeURIComponent(`${subject}: ${name}`)}&body=${encodeURIComponent(body)}`,
  };
}
