"use client";

import { useTranslations } from "next-intl";

interface MenuItem {
  title: string;
  links: {
    text: string;
    url: string;
  }[];
}

interface Footer2Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  tagline?: string;
  menuItems?: MenuItem[];
  copyright?: string;
  bottomLinks?: {
    text: string;
    url: string;
  }[];
}

const Footer = ({
  logo,
  tagline,
  menuItems,
  copyright,
  bottomLinks,
}: Footer2Props) => {
  const t = useTranslations("footer");

  const defaultLogo = {
    src: "",
    alt: "Artek Teknoloji",
    title: t("brand"),
    url: "https://www.artekteknoloji.com",
  };

  const defaultMenuItems = [
    {
      title: t("sections.product"),
      links: [
        { text: t("links.ferriteCores"), url: "/products" },
        { text: t("links.bobbins"), url: "/products" },
        { text: t("links.transformers"), url: "/products" },
        { text: t("links.laminated"), url: "/products" },
      ],
    },
    {
      title: t("sections.company"),
      links: [
        { text: t("links.about"), url: "/about" },
        { text: t("links.contact"), url: "/contact" },
        { text: t("links.products"), url: "/products" },
      ],
    },
    {
      title: "İletişim",
      links: [
        { text: "0212 252 11 68", url: "tel:+902122521168" },
        { text: "0532 718 33 64", url: "tel:+905327183364" },
        { text: "artek@ferritnuve.com", url: "mailto:artek@ferritnuve.com" },
        {
          text: "Ferrit Nüve Erişteci Sokak Abed Han No: 7/1 Karaköy - İstanbul",
          url: "https://maps.google.com/?q=Ferrit%20N%C3%BCve%20Eri%C5%9Fteci%20Sokak%20Abed%20Han%20No%3A%207%2F1%20Karak%C3%B6y%20-%20%C4%B0stanbul",
        },
      ],
    },
    {
      title: t("sections.social"),
      links: [
        { text: t("links.instagram"), url: "https://instagram.com" },
        { text: t("links.linkedin"), url: "https://linkedin.com" },
      ],
    },
  ];

  const defaultBottomLinks = [
    { text: t("terms"), url: "#" },
    { text: t("privacyPolicy"), url: "#" },
  ];

  const finalLogo = logo || defaultLogo;
  const finalTagline = tagline || t("tagline");
  const finalMenuItems = menuItems || defaultMenuItems;
  const finalCopyright = copyright || t("copyright");
  const finalBottomLinks = bottomLinks || defaultBottomLinks;

  return (
    <section className="py-32">
      <div className="mx-auto max-w-6xl px-6">
        <footer>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
            <div className="col-span-2 mb-8 lg:mb-0">
              <div className="flex items-center gap-2 lg:justify-start">
                <h2 className="text-2xl font-bold">{finalLogo.title}</h2>
              </div>
              <p className="mt-4 font-medium text-gray-600">{finalTagline}</p>
            </div>
            {finalMenuItems.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold">{section.title}</h3>
                <ul className="text-muted-foreground space-y-4">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="hover:text-primary font-medium"
                    >
                      <a href={link.url}>{link.text}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-24 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium md:flex-row md:items-center">
            <p>{finalCopyright}</p>
            <ul className="flex gap-4">
              {finalBottomLinks.map((link, linkIdx) => (
                <li key={linkIdx} className="hover:text-primary underline">
                  <a href={link.url}>{link.text}</a>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </section>
  );
};

export { Footer };
