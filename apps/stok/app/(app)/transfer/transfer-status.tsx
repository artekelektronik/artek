import { Badge } from "@artek/ui/components/badge";
import { transferStatusLabels } from "@/lib/labels";

export function TransferStatusBadge({ status }: { status: keyof typeof transferStatusLabels }) {
  return <Badge variant={status === "yolda" ? "default" : "secondary"}>{transferStatusLabels[status]}</Badge>;
}
