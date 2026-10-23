// This layout is required for Next.js but all content 
// is handled by the [locale] layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
