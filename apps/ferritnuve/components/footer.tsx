"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { company } from "@/lib/company";
import { productGroups, groupName } from "@/lib/product-taxonomy";

interface SubSection {
  title: string;
  links: {
    text: string;
    url: string;
  }[];
}

interface MenuItem {
  title: string;
  links: {
    text: string;
    url: string;
  }[];
  subsections?: SubSection[];
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
  const locale = useLocale();

  const defaultLogo = {
    src: "",
    alt: company.name,
    title: company.name,
    url: "/",
  };

  const defaultMenuItems = [
    {
      title: t("sections.product"),
      links: productGroups.map(group => ({text: groupName(group, locale), url: group.href})),
    },
    {
      title: t("sections.company"),
      links: [
        { text: t("links.blog"), url: "/blog" },
        { text: t("links.about"), url: "/about" },
        { text: t("links.contact"), url: "/contact" },
        { text: t("links.products"), url: "/products" },
      ],
      subsections: [
        {
          title: t("sections.certificates"),
          links: [
            { text: t("links.iso9001"), url: "/certificates" },
            { text: t("links.iso45001"), url: "/certificates" },
            { text: t("links.iso10002"), url: "/certificates" },
          ],
        },
      ],
    },
    {
      title: t("links.contact"),
      links: [...company.phones.map(p => ({text:p.label, url:p.href})),
        {text:company.email, url:`mailto:${company.email}`},
        {text:company.address, url:company.map}],
    },
  ];
  const defaultBottomLinks: {text: string; url: string}[] = [];

  const finalLogo = logo || defaultLogo;
  const finalTagline = tagline || t("tagline");
  const finalMenuItems = menuItems || defaultMenuItems;
  const finalCopyright = copyright || t("copyright");
  const finalBottomLinks = bottomLinks || defaultBottomLinks;

  return (
    <section className="bg-artek-ink py-20 text-white sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <footer>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
            <div className="col-span-2 mb-8 lg:mb-0">
              <div className="flex items-center gap-2 lg:justify-start">
                <h2 className="text-2xl font-bold">{finalLogo.title}</h2>
              </div>
              <p className="mt-4 max-w-sm font-medium leading-7 text-slate-300">{finalTagline}</p>
            </div>
            {finalMenuItems.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold">{section.title}</h3>
                <ul className="space-y-4 text-slate-300">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="hover:text-primary font-medium break-words"
                    >
                      <Link href={link.url}>{link.text}</Link>
                    </li>
                  ))}
                </ul>
                {section.subsections && section.subsections.map((subsection, subIdx) => (
                  <div key={subIdx} className="mt-6">
                    <h4 className="mb-3 font-bold text-sm">{subsection.title}</h4>
                    <ul className="ml-0 space-y-2 text-slate-300">
                      {subsection.links.map((link, linkIdx) => (
                        <li
                          key={linkIdx}
                          className="hover:text-primary font-medium text-sm flex items-center"
                        >
                          <span className="mr-2">•</span>
                          <Link href={link.url}>{link.text}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-20 flex flex-col justify-between gap-4 border-t border-white/15 pt-8 text-sm font-medium text-slate-400 md:flex-row md:items-center">
            <p>{finalCopyright}</p>
            <ul className="flex gap-4">
              {finalBottomLinks.map((link, linkIdx) => (
                <li key={linkIdx} className="hover:text-primary underline">
                  <Link href={link.url}>{link.text}</Link>
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
