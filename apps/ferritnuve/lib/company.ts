// Existing public contact details, consolidated without asserting a legal entity name.
export const company = {
  name: "Artek Elektronik",
  email: "artek@ferritnuve.com",
  phones: [{label: "0212 252 11 68", href: "tel:+902122521168"}, {label: "0532 718 33 64", href: "tel:+905327183364"}],
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "905327183364",
  address: "Ferrit Nüve Erişteci Sokak Abed Han No: 7/1 Karaköy - İstanbul",
  map: "https://maps.google.com/?q=" + encodeURIComponent("Erişteci Sokak Abed Han No: 7/1 Karaköy İstanbul"),
} as const;
