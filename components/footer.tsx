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
        { text: t("links.overview"), url: "#" },
        { text: t("links.pricing"), url: "#" },
        { text: t("links.marketplace"), url: "#" },
        { text: t("links.features"), url: "#" },
        { text: t("links.integrations"), url: "#" },
      ],
    },
    {
      title: t("sections.company"),
      links: [
        { text: t("links.about"), url: "#" },
        { text: t("links.team"), url: "#" },
        { text: t("links.blog"), url: "#" },
        { text: t("links.careers"), url: "#" },
        { text: t("links.contact"), url: "#" },
        { text: t("links.privacy"), url: "#" },
      ],
    },
    {
      title: t("sections.resources"),
      links: [
        { text: t("links.help"), url: "#" },
        { text: t("links.sales"), url: "#" },
        { text: t("links.advertise"), url: "#" },
      ],
    },
    {
      title: t("sections.social"),
      links: [
        { text: t("links.twitter"), url: "#" },
        { text: t("links.instagram"), url: "#" },
        { text: t("links.linkedin"), url: "#" },
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
    <section className="py-32 px-4">
      <div className="w-full">
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
