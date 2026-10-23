import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-6">
      <h1 className="text-2xl font-semibold">Sayfa bulunamadı</h1>
      <Link href="/" className="underline underline-offset-4">
        Ana sayfaya dön
      </Link>
    </main>
  );
}
