import { connection } from "next/server";
import { formatIstanbulTime } from "@/lib/time";

export default async function HomePage() {
  // Render per request so the shown time is current, not the build time.
  await connection();
  const now = new Date();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Hoş geldiniz</h1>
      <p className="text-muted-foreground">Stok ekranları hazırlanıyor.</p>
      <p className="text-muted-foreground text-sm">
        Saat (İstanbul): <time dateTime={now.toISOString()}>{formatIstanbulTime(now)}</time>
      </p>
    </div>
  );
}
