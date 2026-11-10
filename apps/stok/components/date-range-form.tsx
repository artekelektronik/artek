import Link from "next/link";
import { Button } from "@artek/ui/components/button";
import { Label } from "@artek/ui/components/label";
import { DatePicker } from "@/components/date-picker";

export type DateRangeParams = { baslangic?: string; bitis?: string };

// Narrows what the page loads to ?baslangic=&bitis=; `keep` carries the page's other URL filters along.
export function DateRangeForm({ params, keep = {} }: { params: DateRangeParams; keep?: Record<string, string | undefined> }) {
  const kept = Object.entries(keep).filter((entry): entry is [string, string] => !!entry[1]);
  return (
    <form className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="baslangic">Başlangıç</Label>
        <DatePicker id="baslangic" name="baslangic" defaultValue={params.baslangic} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="bitis">Bitiş</Label>
        <DatePicker id="bitis" name="bitis" defaultValue={params.bitis} />
      </div>
      {kept.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant="outline">
        Tarihleri uygula
      </Button>
      {(params.baslangic || params.bitis) && (
        <Button asChild variant="ghost">
          <Link href={kept.length ? `?${new URLSearchParams(kept)}` : "?"}>Temizle</Link>
        </Button>
      )}
    </form>
  );
}
