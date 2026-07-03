"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

import { useIsMobile } from "@/hooks/use-mobile";
import { productCatalogPaths } from "@/lib/product-taxonomy";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function ProductNavigation() {
  const isMobile = useIsMobile();
  const t = useTranslations("productNav");

  const products = [
    {
      title: t("allProducts"),
      href: productCatalogPaths.all,
      description: t("allProductsDesc"),
    },
    {
      title: t("pemTitle"),
      href: productCatalogPaths.pem,
      description: t("pemDesc"),
    },
    {
      title: t("ferritTitle"),
      href: productCatalogPaths.ferrit,
      description: t("ferritDesc"),
    },
    {
      title: t("eeTitle"),
      href: productCatalogPaths.eeFerrit,
      description: t("eeDesc"),
    },
  ];

  return (
    <NavigationMenu
      viewport={!isMobile}
      className="**:data-[slot=navigation-menu-viewport]:bg-background **:data-[slot=navigation-menu-viewport]:text-foreground"
    >
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-auto py-1 text-sm font-light text-white bg-transparent hover:bg-transparent hover:text-white focus:bg-transparent focus:text-black data-[state=open]:bg-transparent data-[state=open]:text-black">
            {t("title")}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-background text-foreground">
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-background">
              <li className="row-span-4">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-linear-to-b from-muted/50 to-muted p-6 no-underline outline-none transition-colors hover:from-muted/70 hover:to-muted hover:text-foreground focus:shadow-md focus:text-foreground"
                    href={productCatalogPaths.all}
                  >
                    <img
                      src="/emc_filter.png"
                      alt="Featured Product"
                      width={200}
                      height={200}
                      className="mb-4 rounded-md"
                    />
                    <div className="mb-2 mt-4 text-lg font-medium text-foreground hover:text-foreground">
                      {t("ourProducts")}
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground hover:text-muted-foreground">
                      {t("ourProductsDesc")}
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              {products.map((product) => (
                <ListItem
                  key={product.title}
                  title={product.title}
                  href={product.href}
                >
                  {product.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted hover:text-foreground focus:text-foreground"
        >
          <div className="text-sm font-medium leading-none text-foreground hover:text-foreground">
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground hover:text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
