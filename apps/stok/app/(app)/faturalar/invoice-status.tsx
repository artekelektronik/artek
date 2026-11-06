import { Badge } from "@artek/ui/components/badge";
import { invoiceStatusLabels } from "@/lib/labels";

export function InvoiceStatusBadge({ status }: { status: keyof typeof invoiceStatusLabels }) {
  return status === "taslak" ? (
    <Badge variant="outline" className="border-amber-300 text-amber-800 dark:text-amber-200">
      {invoiceStatusLabels.taslak}
    </Badge>
  ) : (
    <Badge variant="secondary">{invoiceStatusLabels.onaylandi}</Badge>
  );
}
