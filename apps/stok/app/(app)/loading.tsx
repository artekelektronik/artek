import { Skeleton } from "@artek/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" aria-busy="true" aria-label="Yükleniyor">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="min-h-64 flex-1" />
    </div>
  );
}
