import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import React from "react";
import { ProductNavigation } from "./product-navigation";

const Header = () => {
  return (
    <nav className="h-11 fixed top-0 left-0 right-0 bg-outer-space/70 backdrop-blur-sm z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between w-full h-full px-4">
        <div className="flex justify-center items-center gap-8">
          <Link href="/" className="text-lg font-medium text-white uppercase">
            Artek Teknoloji
          </Link>
          <div className="flex items-center space-x-4 text-sm font-light">
            <ProductNavigation />
            <Link href="/about" className="text-white">
              About
            </Link>
            <Link href="/contact" className="text-white">
              Contact
            </Link>
          </div>
        </div>

        <div className="flex justify-center items-center gap-4">
          <Link href="/login" className="text-white">
            <Search size={16} />
          </Link>
          <Link href="/signup" className="text-white">
            <ShoppingCart size={16} />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export { Header };
