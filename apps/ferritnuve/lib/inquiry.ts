import { company } from "./company";
export function inquiryLinks(name: string, code: string | undefined, url: string, locale: string) {
  const subject = locale === "en" ? "Enquire about this product" : "Bu ürün hakkında bilgi alın";
  const body = `${subject}\n${name}${code ? `\n${locale === "en" ? "Code" : "Kod"}: ${code}` : ""}\n${url}`;
  return {
    whatsapp: `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(body)}`,
    email: `mailto:${company.email}?subject=${encodeURIComponent(`${subject}: ${name}`)}&body=${encodeURIComponent(body)}`,
  };
}
