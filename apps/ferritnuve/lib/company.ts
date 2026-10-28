import { groupName, productGroups } from "./product-taxonomy";
import { getLocalizedPath } from "./seo";

// Existing public contact details, consolidated without asserting a legal entity name.
export const company = {
  name: "Artek Elektronik",
  email: "artek@ferritnuve.com",
  phones: [{label: "0212 252 11 68", href: "tel:+902122521168"}, {label: "0532 718 33 64", href: "tel:+905327183364"}],
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "905327183364",
  address: "Ferrit Nüve Erişteci Sokak Abed Han No: 7/1 Karaköy - İstanbul",
  map: "https://maps.google.com/?q=" + encodeURIComponent("Erişteci Sokak Abed Han No: 7/1 Karaköy İstanbul"),
} as const;

// The one business node every page carries; blog posts point to it by @id so search engines and AI see one Artek.
export function businessStructuredData(siteUrl: string, locale: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#business`,
    name: company.name,
    url: siteUrl,
    description,
    telephone: company.phones.map(p => p.href.replace("tel:", "")),
    email: company.email,
    address: {"@type": "PostalAddress", streetAddress: "Erişteci Sokak Abed Han No: 7/1", addressLocality: "Karaköy", addressRegion: "İstanbul", addressCountry: "TR"},
    hasMap: company.map,
    knowsAbout: productGroups.map(group => groupName(group, locale)),
    hasOfferCatalog: {"@type": "OfferCatalog", name: locale === "en" ? "Product catalog" : "Ürün kataloğu", url: `${siteUrl}${getLocalizedPath(locale, "/products")}`},
  };
}
