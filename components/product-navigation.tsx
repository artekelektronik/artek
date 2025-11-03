"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

const products: { title: string; href: string; description: string }[] = [
  {
    title: "EMC Filters",
    href: "/products/emc-filters",
    description: "Precision engineered electronic components for EMI suppression.",
  },
  {
    title: "Ferrite Cores",
    href: "/products/ferrite-cores",
    description: "Superior magnetic performance for optimal EMI suppression.",
  },
  {
    title: "Power Components",
    href: "/products/power-components",
    description: "High-performance components for critical systems.",
  },
]

export function ProductNavigation() {
  const isMobile = useIsMobile()

  return (
    <NavigationMenu viewport={!isMobile} className="**:data-[slot=navigation-menu-viewport]:bg-background **:data-[slot=navigation-menu-viewport]:text-foreground">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-auto py-1 text-sm font-light text-white bg-transparent hover:bg-transparent hover:text-white focus:bg-transparent focus:text-white data-[state=open]:bg-transparent data-[state=open]:text-white">
            Products
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-background text-foreground">
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-background">
              <li className="row-span-4">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-linear-to-b from-muted/50 to-muted p-6 no-underline outline-none transition-colors hover:from-muted/70 hover:to-muted hover:text-foreground focus:shadow-md focus:text-foreground"
                    href="/products"
                  >
                    <Image
                      src="/emc_filter.png"
                      alt="Featured Product"
                      width={200}
                      height={200}
                      className="mb-4 rounded-md"
                    />
                    <div className="mb-2 mt-4 text-lg font-medium text-foreground hover:text-foreground">
                      Our Products
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground hover:text-muted-foreground">
                      High-quality electronic components for demanding applications.
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
              <ListItem
                title="Signal Transformers"
                href="/products/signal-transformers"
              >
                Precision transformers for specialized applications.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
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
          <div className="text-sm font-medium leading-none text-foreground hover:text-foreground">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground hover:text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}