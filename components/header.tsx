"use client";

import React from "react";
import { Search, Globe, Menu, X, Grid3x3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { SearchDialog } from "./search-dialog";
import { PemIcon, FerritIcon, EeIcon } from "./icons";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useMedia } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { productCatalogPaths } from "@/lib/product-taxonomy";

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "905327183364";

const Header = () => {
  const t = useTranslations("nav");
  const tProduct = useTranslations("productNav");
  const pathname = usePathname();
  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
    t("whatsappMessage")
  )}`;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const isMobile = useMedia("(max-width: 1023px)");
  const isLarge = !isMobile;

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isMobileMenuOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <SearchDialog />
      <header
        role="banner"
        data-state={isMobileMenuOpen ? "active" : "inactive"}
        {...(isScrolled && { "data-scrolled": true })}
        className="has-data-[state=open]:h-screen has-data-[state=open]:backdrop-blur has-data-[state=open]:bg-background/60 fixed inset-x-0 top-0 z-50"
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-50 h-14 border-b border-white/15 bg-artek-navy text-white ring-1 ring-transparent transition-all duration-300",
            "data-[scrolled]:border-white/10 data-[scrolled]:bg-artek-navy/95 data-[scrolled]:shadow-lg data-[scrolled]:shadow-slate-950/15 data-[scrolled]:backdrop-blur-xl",
            "has-data-[state=open]:ring-foreground/5 has-data-[state=open]:border-transparent has-data-[state=open]:bg-card/75 has-data-[state=open]:shadow-lg has-data-[state=open]:backdrop-blur has-data-[state=open]:border-b has-data-[state=open]:shadow-black/10 has-data-[state=open]:h-[calc(var(--navigation-menu-viewport-height)+3.4rem)]",
            "max-lg:data-[state=active]:h-screen max-lg:data-[state=active]:bg-background/75 max-lg:data-[state=active]:backdrop-blur max-lg:h-14 max-lg:overflow-hidden max-lg:border-b"
          )}
          data-scrolled={isScrolled || undefined}
          data-state={isMobileMenuOpen ? "active" : "inactive"}
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="relative flex flex-wrap items-center justify-between lg:py-3">
              <div
                aria-hidden
                className="data-[state=active]:block absolute inset-x-0 bottom-0 hidden h-px bg-[length:4px_1px] bg-repeat-x opacity-20 [background-image:linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)]"
                data-state={isMobileMenuOpen ? "active" : "inactive"}
              />

              <div className="flex items-center justify-between gap-8 max-lg:h-14 max-lg:w-full max-lg:border-b">
                <Link
                  href="/"
                  aria-label="home"
                  className="text-lg font-semibold tracking-tight text-white"
                >
                  {t("brand")}
                </Link>

                {!isLarge && (
                  <button
                    onClick={() => setIsMobileMenuOpen((p) => !p)}
                    aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
                    className="relative z-20 -m-2.5 -mr-3 block cursor-pointer p-2.5 lg:hidden"
                  >
                    <Menu
                      className="data-[state=active]:rotate-180 data-[state=active]:scale-0 data-[state=active]:opacity-0 m-auto size-5 duration-200"
                      data-state={isMobileMenuOpen ? "active" : "inactive"}
                    />
                    <X
                      className="data-[state=active]:rotate-0 data-[state=active]:scale-100 data-[state=active]:opacity-100 absolute inset-0 m-auto size-5 -rotate-180 scale-0 opacity-0 duration-200"
                      data-state={isMobileMenuOpen ? "active" : "inactive"}
                    />
                  </button>
                )}
              </div>

              {isLarge && (
                <div className="absolute inset-0 m-auto size-fit">
                  <NavMenu t={t} tProduct={tProduct} />
                </div>
              )}

              {!isLarge && isMobileMenuOpen && (
                <MobileMenu
                  closeMenu={() => setIsMobileMenuOpen(false)}
                  whatsappUrl={whatsappUrl}
                  tProduct={tProduct}
                  translations={{
                    about: t("about"),
                    contact: t("contact"),
                    whatsappLabel: t("whatsappLabel"),
                  }}
                />
              )}

              <div
                className="max-lg:data-[state=active]:mt-6 data-[state=active]:flex hidden w-full flex-nowrap items-center justify-end gap-2 lg:m-0 lg:flex lg:w-fit lg:gap-3 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent"
                data-state={isMobileMenuOpen ? "active" : "inactive"}
              >
                <LanguageSwitcher pathname={pathname} />
                <Button
                  onClick={() => {
                    const event = new KeyboardEvent("keydown", {
                      key: "k",
                      metaKey: true,
                    });
                    document.dispatchEvent(event);
                  }}
                  variant="outline"
                  title="Search (Cmd+K)"
                  className="h-8 border-white/20 bg-white text-artek-navy hover:bg-artek-sky hover:text-artek-ink"
                >
                  <Search size={12} />
                  <span className="hidden sm:inline">{t("search")}</span>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-white/20 bg-white text-artek-navy hover:bg-artek-sky hover:text-artek-ink">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon size={14} />
                    <span className="hidden sm:inline text-xs font-medium">
                      {t("whatsappLabel")}
                    </span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

function LanguageSwitcher({ pathname }: { pathname: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="size-8 border-white/20 bg-white text-artek-navy hover:bg-artek-sky hover:text-artek-ink">
          <Globe size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem asChild>
          <Link
            href={pathname}
            locale="tr"
            className="flex items-center gap-2 cursor-pointer"
          >
            <span aria-hidden className="text-base leading-none">TR</span>
            <span>Türkçe</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={pathname}
            locale="en"
            className="flex items-center gap-2 cursor-pointer"
          >
            <span aria-hidden className="text-base leading-none">EN</span>
            <span>English</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu({
  closeMenu,
  whatsappUrl,
  tProduct,
  translations,
}: {
  closeMenu: () => void;
  whatsappUrl: string;
  tProduct: (key: string) => string;
  translations: {
    about: string;
    contact: string;
    whatsappLabel: string;
  };
}) {
  const productCategories = [
    {
      title: tProduct("allProducts"),
      href: productCatalogPaths.all,
      icon: <Grid3x3 className="stroke-foreground fill-blue-500/15" />,
    },
    {
      title: tProduct("pemTitle"),
      href: productCatalogPaths.pem,
      icon: <PemIcon className="stroke-foreground fill-green-500/15" />,
    },
    {
      title: tProduct("ferritTitle"),
      href: productCatalogPaths.ferrit,
      icon: <FerritIcon className="stroke-foreground fill-indigo-500/15" />,
    },
    {
      title: tProduct("eeTitle"),
      href: productCatalogPaths.eeFerrit,
      icon: <EeIcon className="stroke-foreground fill-blue-500/15" />,
    },
  ];

  const mobileLinks = [
    {
      groupName: tProduct("title"),
      links: productCategories,
    },
    { name: translations.about, href: "/about" },
    { name: translations.contact, href: "/contact" },
  ];

  return (
    <nav role="navigation" className="w-full pb-6 pt-2">
      <Accordion
        type="single"
        collapsible
        className="**:hover:no-underline -mx-4 mt-0.5 space-y-0.5"
      >
        {mobileLinks.map((link, index) => {
          if ("groupName" in link && link.links) {
            return (
              <AccordionItem
                key={index}
                value={link.groupName}
                className="before:border-border group relative border-b-0 before:pointer-events-none before:absolute before:inset-x-4 before:bottom-0 before:border-b"
              >
                <AccordionTrigger className="**:font-normal! data-[state=open]:bg-muted flex items-center justify-between px-4 py-3 text-lg">
                  {link.groupName}
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <ul>
                    {link.links.map((feature, featureIndex) => (
                      <li key={featureIndex}>
                        <Link
                          href={feature.href}
                          onClick={closeMenu}
                          className="grid grid-cols-[auto_1fr] items-center gap-2.5 px-4 py-2 hover:bg-muted/50 rounded-md transition-colors"
                        >
                          <div
                            aria-hidden
                            className="flex items-center justify-center *:size-4"
                          >
                            {feature.icon}
                          </div>
                          <div className="text-base">{feature.title}</div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          }
          return null;
        })}
      </Accordion>
      {mobileLinks.map((link, index) => {
        if ("name" in link && link.href) {
          return (
            <Link
              key={index}
              href={link.href}
              onClick={closeMenu}
              className="group relative block px-4 py-4 text-base hover:bg-muted/50 rounded-md transition-colors"
            >
              {link.name}
            </Link>
          );
        }
        return null;
      })}
      <div className="px-4 pt-4">
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            {translations.whatsappLabel}
          </a>
        </Button>
      </div>
    </nav>
  );
}

const NavMenu = ({ t, tProduct }: { t: (key: string) => string; tProduct: (key: string) => string }) => {
  const menuRef = React.useRef<React.ElementRef<typeof NavigationMenu>>(null);

  const handleViewportHeight = () => {
    requestAnimationFrame(() => {
      const menuNode = menuRef.current;
      if (!menuNode) return;

      const openContent = document.querySelector<HTMLElement>(
        '[data-slot="navigation-menu-viewport"][data-state="open"]'
      );

      if (openContent) {
        const height = openContent.scrollHeight;
        document.documentElement.style.setProperty(
          "--navigation-menu-viewport-height",
          `${height}px`
        );
      } else {
        document.documentElement.style.removeProperty(
          "--navigation-menu-viewport-height"
        );
      }
    });
  };

  const mainProducts = [
    {
      href: productCatalogPaths.pem,
      title: tProduct("pemTitle"),
      description: tProduct("pemDesc"),
      icon: <PemIcon className="stroke-foreground fill-green-500/15" />,
    },
    {
      href: productCatalogPaths.ferrit,
      title: tProduct("ferritTitle"),
      description: tProduct("ferritDesc"),
      icon: <FerritIcon className="stroke-foreground fill-indigo-500/15" />,
    },
    {
      href: productCatalogPaths.eeFerrit,
      title: tProduct("eeTitle"),
      description: tProduct("eeDesc"),
      icon: <EeIcon className="stroke-foreground fill-blue-500/15" />,
    },
  ];

  return (
    <NavigationMenu
      ref={menuRef}
      onValueChange={handleViewportHeight}
      className="**:data-[slot=navigation-menu-viewport-parent]:max-w-268 **:data-[slot=navigation-menu-viewport]:bg-background **:data-[slot=navigation-menu-viewport]:text-foreground **:data-[slot=navigation-menu-viewport]:rounded-none **:data-[slot=navigation-menu-viewport]:ring-0 **:data-[slot=navigation-menu-viewport]:border-0 **:data-[slot=navigation-menu-viewport]:shadow-none [--color-muted:color-mix(in_oklch,var(--color-foreground)_5%,transparent)] [--viewport-outer-px:2rem] max-lg:hidden"
    >
      <NavigationMenuList className="gap-3">
        <NavigationMenuItem value="product">
          <NavigationMenuTrigger className="bg-transparent text-white hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white">{tProduct("title")}</NavigationMenuTrigger>
          <NavigationMenuContent className="mt-4.5 origin-top pb-14 pt-5">
            <div className="min-w-5xl divide-foreground/10 grid w-full grid-cols-3 gap-4 divide-x pr-12">
              <div className="row-span-2 -mr-2 grid grid-rows-subgrid gap-1 pr-2">
                <span className="text-muted-foreground ml-2 text-xs">
                  {tProduct("categories")}
                </span>
                <ul className="mt-1 space-y-2">
                  {mainProducts.map((product, index) => (
                    <ListItem
                      key={index}
                      href={product.href}
                      title={product.title}
                      description={product.description}
                    >
                      {product.icon}
                    </ListItem>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 row-span-2 grid grid-rows-subgrid gap-1 border-r-0 pl-4">
                <span className="text-muted-foreground ml-2 text-xs">
                  {tProduct("featured")}
                </span>
                <div className="relative mt-3 grid overflow-hidden bg-muted/30 p-1 transition-colors duration-200 hover:bg-muted/50">
                  <div className="absolute inset-0 px-6">
                    <div className="relative h-full w-full overflow-hidden p-4">
                      <img
                        src="/emc_filter.png"
                        alt={tProduct("ourProducts")}
                        width={200}
                        height={200}
                        className="mx-auto object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5 self-end p-3 pt-48">
                    <NavigationMenuLink
                      asChild
                      className="text-foreground p-0 text-sm font-medium before:absolute before:inset-0 hover:bg-transparent focus:bg-transparent"
                    >
                      <Link href="/products">{tProduct("ourProducts")}</Link>
                    </NavigationMenuLink>
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {tProduct("ourProductsDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="about">
          <NavigationMenuLink
            asChild
            className={cn(
              navigationMenuTriggerStyle(),
              "bg-transparent text-white hover:bg-white/10 hover:text-white"
            )}
          >
            <Link href="/about">{t("about")}</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem value="contact">
          <NavigationMenuLink
            asChild
            className={cn(
              navigationMenuTriggerStyle(),
              "bg-transparent text-white hover:bg-white/10 hover:text-white"
            )}
          >
            <Link href="/contact">{t("contact")}</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

function ListItem({
  title,
  description,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  title: string;
  description?: string;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="grid grid-cols-[auto_1fr] gap-3.5 p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="bg-background ring-foreground/10 relative flex size-9 items-center justify-center border border-transparent shadow-sm ring-1">
            {children}
          </div>
          <div className="space-y-0.5">
            <div className="text-foreground text-sm font-medium">{title}</div>
            <p className="text-muted-foreground line-clamp-1 text-xs">
              {description}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export { Header };
