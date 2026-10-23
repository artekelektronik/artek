import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { reverseMovementAction } from "@/app/(app)/hareketler/actions";
import type { listMovements } from "@/lib/ledger";
import { displayQuantity, formatDateTime, movementTypeLabels } from "@/lib/labels";
import { unitLabels } from "@/lib/quantity";
import { ReverseButton } from "./reverse-button";

type Movement = Awaited<ReturnType<typeof listMovements>>[number];

export function MovementTable({ movements, canReverse }: { movements: Movement[]; canReverse: boolean }) {
  const reversed = new Set(movements.map((m) => m.reversesId).filter(Boolean));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Zaman</TableHead>
          <TableHead>Tür</TableHead>
          <TableHead>Ürün</TableHead>
          <TableHead>Lokasyon</TableHead>
          <TableHead className="text-right">Miktar</TableHead>
          <TableHead>Kullanıcı</TableHead>
          <TableHead>Belge / neden</TableHead>
          {canReverse && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="whitespace-nowrap">{formatDateTime(m.createdAt)}</TableCell>
            <TableCell>
              {movementTypeLabels[m.type]}
              {m.reversesId && <span className="text-muted-foreground"> (ters kayıt)</span>}
            </TableCell>
            <TableCell>
              <Link href={`/urunler/${m.productId}`} className="font-mono underline-offset-4 hover:underline">
                {m.productCode}
              </Link>
            </TableCell>
            <TableCell>{m.lokasyonName ?? "Yolda"}</TableCell>
            <TableCell className="text-right tabular-nums">
              {displayQuantity(m.quantity)} {unitLabels[m.unit]}
            </TableCell>
            <TableCell>{m.userName}</TableCell>
            <TableCell className="max-w-64 truncate">
              {[m.supplier, m.reference, m.reason].filter(Boolean).join(" · ")}
            </TableCell>
            {canReverse && (
              <TableCell>
                {!m.reversesId && !reversed.has(m.id) && <ReverseButton action={reverseMovementAction.bind(null, m.id)} />}
              </TableCell>
            )}
          </TableRow>
        ))}
        {movements.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-muted-foreground text-center">
              Hareket yok.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
