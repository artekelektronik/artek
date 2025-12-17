"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid3x3, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProductControlsProps {
  gridColumns: number;
  onGridColumnsChange: (columns: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

// Get view options based on grid layout
function getViewOptions(gridColumns: number): { value: number; label: string }[] {
  if (gridColumns === 2) {
    return [
      { value: 10, label: "10" },
      { value: 20, label: "20" },
      { value: 50, label: "50" },
      { value: 100, label: "100" },
    ];
  } else {
    // 3 columns - multiples of 9
    return [
      { value: 9, label: "9" },
      { value: 18, label: "18" },
      { value: 36, label: "36" },
      { value: 72, label: "72" },
    ];
  }
}

export function ProductControls({
  gridColumns,
  onGridColumnsChange,
  itemsPerPage,
  onItemsPerPageChange,
  sortBy,
  onSortChange,
}: ProductControlsProps) {
  const t = useTranslations("controls");
  const viewOptions = getViewOptions(gridColumns);

  return (
    <div className="flex items-center justify-between gap-4 pb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("view")}</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
          >
            <SelectTrigger className="h-9 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {viewOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder={t("sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sortNewest")}</SelectItem>
            <SelectItem value="name-asc">{t("sortNameAsc")}</SelectItem>
            <SelectItem value="name-desc">{t("sortNameDesc")}</SelectItem>
            <SelectItem value="price-asc">{t("sortPriceAsc")}</SelectItem>
            <SelectItem value="price-desc">{t("sortPriceDesc")}</SelectItem>
            <SelectItem value="stock-desc">{t("sortStockDesc")}</SelectItem>
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          value={gridColumns.toString()}
          onValueChange={(value) => value && onGridColumnsChange(Number(value))}
          className="hidden sm:flex"
        >
          <ToggleGroupItem value="2" aria-label="2 columns" size="sm">
            <Grid3x3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="3" aria-label="3 columns" size="sm">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
