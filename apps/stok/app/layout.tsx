import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@artek/ui/components/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artek Stok",
  description: "Artek'in stok, üretim ve satış takibi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes sets the theme class before React hydrates, so <html> differs from the server render on purpose.
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
