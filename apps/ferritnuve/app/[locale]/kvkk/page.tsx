import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ConsentReset } from "@/components/consent";
import { company } from "@/lib/company";
import { getLanguageAlternates, getLocalizedPath, getSiteUrl } from "@/lib/seo";

type Props = {params: Promise<{locale: string}>};
type Section = {title: string; paragraphs?: string[]; items?: string[]; cookies?: true};

const updated = "2026-11-23";

// Describes what the site actually does today: the Tally contact form, WhatsApp/email/phone links and the visit statistics.
// Update this page whenever a new form or tool starts collecting data.
const content: Record<"tr" | "en", {title: string; description: string; intro: string; sections: Section[]}> = {
  tr: {
    title: "KVKK Aydınlatma Metni ve Gizlilik",
    description: "Artek Elektronik'in ferritnuve.com üzerinden hangi kişisel verileri, hangi amaçla işlediği ve haklarınızı nasıl kullanabileceğiniz.",
    intro: "Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun (KVKK) 10. maddesi uyarınca, ferritnuve.com sitesini kullanırken ve bizimle iletişime geçerken işlenen kişisel verileriniz hakkında sizi bilgilendirmek için hazırlanmıştır.",
    sections: [
      {title: "Veri sorumlusu", paragraphs: [`Veri sorumlusu ${company.legalName}'dir.`], items: [`Adres: ${company.address}`, `E-posta: ${company.email}`, `Telefon: ${company.phones[0].label}`]},
      {title: "Hangi verileri işliyoruz", items: [
        "İletişim formu: ad soyad, e-posta adresi, telefon numarası, seçtiğiniz kategori ve yazdığınız mesaj.",
        "WhatsApp, e-posta veya telefonla bize ulaştığınızda: adınız, telefon numaranız veya e-posta adresiniz ve bize ilettiğiniz bilgiler.",
        "Site kullanım verileri (yalnızca istatistik çerezlerini kabul ederseniz): ziyaret ettiğiniz sayfalar, tıkladığınız iletişim bağlantıları, tarayıcı ve cihaz bilgisi, yaklaşık konum (ülke, şehir) ve IP adresi.",
        "Sık sorulan sorular sayfasındaki aramalar: telefon numarası ve e-posta adresi gibi ifadeler silinerek, kimliğinizle ilişkilendirilmeden kaydedilir.",
      ]},
      {title: "Hangi amaçla işliyoruz", items: [
        "Bilgi ve teklif taleplerinizi yanıtlamak, size uygun ürünü belirlemek ve teklif hazırlamak.",
        "Talebinizle ilgili sizinle iletişim kurmak.",
        "Sitenin hangi sayfalarının kullanıldığını ölçmek ve içeriği iyileştirmek.",
        "Yasal yükümlülüklerimizi yerine getirmek.",
      ], paragraphs: ["Verilerinizi pazarlama amacıyla üçüncü kişilere satmıyor veya kiralamıyoruz."]},
      {title: "Hukuki sebep ve toplama yöntemi", paragraphs: [
        "Verileriniz; formu doldurmanız, bize yazmanız veya bizi aramanız yoluyla doğrudan sizden ve siteyi ziyaretiniz sırasında otomatik yollarla toplanır.",
        "Talep ve teklif süreçlerine ilişkin veriler, KVKK'nın 5. maddesinin 2. fıkrasının (c) bendi (bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması) ve (f) bendi (veri sorumlusunun meşru menfaati) kapsamında işlenir. Yasal yükümlülüklerimiz için işlenen veriler (ç) bendine dayanır.",
        "Site kullanım istatistikleri, yalnızca çerez bandında kabul etmeniz halinde, KVKK'nın 5. maddesinin 1. fıkrası uyarınca açık rızanıza dayanarak toplanır.",
      ]},
      {title: "Çerezler", cookies: true, paragraphs: [
        "Google Analytics ve PostHog, siz kabul etmeden yüklenmez ve cihazınıza çerez yerleştirmez. Reddederseniz site aynı şekilde çalışır. Seçiminiz yalnızca tarayıcınızda saklanır.",
        "Barındırma sağlayıcımız Vercel, çerez kullanmadan ve kimliğinizi belirlemeden toplu ziyaret sayıları tutar. İletişim sayfasındaki form Tally tarafından sunulur ve formun çalışması için gerekli kendi çerezlerini kullanabilir.",
      ]},
      {title: "Verilerin aktarıldığı taraflar", paragraphs: ["Verileriniz yalnızca yukarıdaki amaçlar için, hizmet aldığımız şu sağlayıcılarla paylaşılır. Bu sağlayıcıların sunucuları yurt dışında bulunabilir:"], items: [
        "Tally (iletişim formu altyapısı)",
        "Vercel (sitenin barındırılması ve ziyaret istatistikleri)",
        "Google Analytics ve PostHog (site kullanım istatistikleri, yalnızca kabul ederseniz)",
        "WhatsApp (yalnızca siz WhatsApp üzerinden yazmayı seçtiğinizde)",
      ]},
      {title: "Saklama süresi", paragraphs: ["Talep ve yazışma kayıtları, talebiniz sonuçlanana kadar ve ilgili mevzuatta öngörülen saklama süreleri boyunca saklanır; süre dolduğunda silinir, yok edilir veya anonim hale getirilir."]},
      {title: "Haklarınız", paragraphs: ["KVKK'nın 11. maddesi uyarınca şu haklara sahipsiniz:"], items: [
        "Kişisel verinizin işlenip işlenmediğini öğrenme ve işlenmişse buna ilişkin bilgi talep etme,",
        "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
        "Yurt içinde veya yurt dışında verinin aktarıldığı üçüncü kişileri bilme,",
        "Eksik veya yanlış işlenmişse düzeltilmesini isteme,",
        "Kanun'daki şartlar çerçevesinde silinmesini veya yok edilmesini isteme,",
        "Düzeltme, silme ve yok etme işlemlerinin verinin aktarıldığı üçüncü kişilere bildirilmesini isteme,",
        "Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına itiraz etme,",
        "Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme.",
      ]},
      {title: "Başvuru", paragraphs: [`Taleplerinizi ${company.email} adresine e-posta ile veya yukarıdaki adrese yazılı olarak iletebilirsiniz. Başvurunuzda adınızı, soyadınızı, iletişim bilginizi ve talebinizi belirtmeniz yeterlidir. Başvurunuz en geç 30 gün içinde yanıtlanır.`]},
    ],
  },
  en: {
    title: "Privacy Notice",
    description: "Which personal data Artek Elektronik processes through ferritnuve.com, for what purpose, and how you can use your rights.",
    intro: "This notice explains, under Article 10 of the Turkish Personal Data Protection Law No. 6698 (KVKK), how your personal data is processed when you use ferritnuve.com and when you contact us. The Turkish version is the authoritative text.",
    sections: [
      {title: "Data controller", paragraphs: [`The data controller is ${company.legalName}.`], items: [`Address: ${company.address}`, `Email: ${company.email}`, `Phone: ${company.phones[0].label}`]},
      {title: "Data we process", items: [
        "Contact form: full name, email address, phone number, the category you choose and your message.",
        "When you reach us by WhatsApp, email or phone: your name, phone number or email address and the information you send us.",
        "Site usage data (only if you accept statistics cookies): pages visited, contact links clicked, browser and device information, approximate location (country, city) and IP address.",
        "Searches on the FAQ page: recorded without being linked to you, with phone numbers and email addresses removed.",
      ]},
      {title: "Why we process it", items: [
        "To answer your enquiries and quote requests, identify the right product and prepare a quote.",
        "To contact you about your request.",
        "To measure which pages are used and improve the content.",
        "To meet our legal obligations.",
      ], paragraphs: ["We do not sell or rent your data to third parties for marketing."]},
      {title: "Legal basis and collection method", paragraphs: [
        "Data is collected directly from you when you fill in the form, write to us or call us, and automatically while you visit the site.",
        "Data about enquiries and quotes is processed under Article 5(2)(c) of the KVKK (directly related to concluding or performing a contract) and Article 5(2)(f) (legitimate interest of the data controller). Data processed for legal obligations relies on Article 5(2)(ç).",
        "Site usage statistics are collected only if you accept in the cookie banner, on the basis of your explicit consent under Article 5(1) of the KVKK.",
      ]},
      {title: "Cookies", cookies: true, paragraphs: [
        "Google Analytics and PostHog are not loaded and set no cookies on your device until you accept. The site works the same if you decline. Your choice is stored only in your browser.",
        "Our hosting provider Vercel keeps aggregate visit counts without cookies and without identifying you. The form on the contact page is served by Tally and may use its own cookies needed for the form to work.",
      ]},
      {title: "Who receives the data", paragraphs: ["Your data is shared only for the purposes above with the following service providers. Their servers may be located outside Türkiye:"], items: [
        "Tally (contact form)",
        "Vercel (site hosting and visit statistics)",
        "Google Analytics and PostHog (site usage statistics, only if you accept)",
        "WhatsApp (only when you choose to write to us on WhatsApp)",
      ]},
      {title: "Retention", paragraphs: ["Enquiry and correspondence records are kept until your request is concluded and for the retention periods required by law; after that they are deleted, destroyed or anonymised."]},
      {title: "Your rights", paragraphs: ["Under Article 11 of the KVKK you have the right to:"], items: [
        "learn whether your personal data is processed and request information about it,",
        "learn the purpose of processing and whether it is used accordingly,",
        "know the third parties, in Türkiye or abroad, to whom it is transferred,",
        "request correction if it is incomplete or inaccurate,",
        "request deletion or destruction under the conditions set out in the law,",
        "request that correction, deletion or destruction be notified to third parties who received the data,",
        "object to a result against you produced solely by automated analysis,",
        "claim compensation if you suffer damage from unlawful processing.",
      ]},
      {title: "How to apply", paragraphs: [`Send your request by email to ${company.email} or in writing to the address above. Your name, contact details and request are enough. We reply within 30 days at the latest.`]},
    ],
  },
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const page = content[locale === "en" ? "en" : "tr"];
  const site = await getSiteUrl();
  return {title: `${page.title} | Artek Elektronik`, description: page.description, alternates: {canonical: `${site}${getLocalizedPath(locale, "/kvkk")}`, languages: getLanguageAlternates(site, "/kvkk")}};
}

export default async function PrivacyPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const tr = locale !== "en";
  const page = content[tr ? "tr" : "en"];
  return <main className="mx-auto max-w-3xl px-6 pb-24 pt-24">
    <h1 className="text-4xl font-semibold tracking-tight">{page.title}</h1>
    <p className="mt-3 text-sm text-slate-600">{tr ? "Son güncelleme" : "Last updated"}: <time dateTime={updated}>{new Date(updated).toLocaleDateString(tr ? "tr-TR" : "en-GB", {day: "numeric", month: "long", year: "numeric"})}</time></p>
    <p className="mt-6 leading-7 text-slate-700">{page.intro}</p>
    {page.sections.map(section => <section key={section.title} className="mt-10">
      <h2 className="text-2xl font-semibold">{section.title}</h2>
      {section.paragraphs?.map(text => <p key={text} className="mt-3 leading-7 text-slate-700">{text}</p>)}
      {section.cookies && <ConsentReset />}
      {section.items && <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-slate-700">{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
    </section>)}
  </main>;
}
