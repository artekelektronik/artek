"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { cn } from "@artek/ui/lib/utils";
import { categoriesOf, searchProducts, type SearchableProduct, type SearchKind } from "@/lib/product-search";
import { formatQuantity, unitLabels, type Unit } from "@/lib/quantity";
import { CategoryBadge, CategoryDot } from "./stock-badges";

type PickableProduct = SearchableProduct & { unit: Unit };
type Available = Record<string, string>;

const label = (product: PickableProduct) => `${product.name} — ${product.code}`;

const heading = (kind: SearchKind, typed: string) => {
  if (kind === "other-category") return "Bu kategoride yok, diğer kategorilerde bulundu:";
  if (kind === "similar") return `“${typed}” bulunamadı. Buna benzer ürünler:`;
  if (kind === "none") return `“${typed}” bulunamadı, benzer ürün de yok.`;
  return null;
};

// `available` (product id → quantity) shows what can be taken, for screens that take stock out of one Lokasyon.
export function ProductLines({
  products,
  available,
  initialRows = 1,
}: {
  products: PickableProduct[];
  available?: Available;
  initialRows?: number;
}) {
  const [rows, setRows] = useState(() => Array.from({ length: initialRows }, () => crypto.randomUUID()));
  const [added, setAdded] = useState<string>();
  const [picked, setPicked] = useState<Record<string, PickableProduct | undefined>>({});
  const [category, setCategory] = useState<string>();
  const lines = useRef<HTMLDivElement>(null);
  const categories = categoriesOf(products);

  function chooseCategory(next?: string) {
    setCategory(next);
    // Straight to typing the code, in the first row still waiting for a product.
    lines.current?.querySelector<HTMLInputElement>("input[data-unpicked]")?.focus();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
      {categories.length > 1 && (
        <div role="group" aria-label="Kategori" className="flex flex-wrap gap-1 sm:w-40 sm:flex-col sm:flex-nowrap">
          <CategoryButton name="Tümü" count={products.length} active={!category} onClick={() => chooseCategory()} />
          {categories.map((c) => (
            <CategoryButton key={c.name} name={c.name} count={c.count} active={category === c.name} colored onClick={() => chooseCategory(c.name)} />
          ))}
        </div>
      )}
      <div ref={lines} className="flex min-w-0 flex-1 flex-col gap-2">
        {rows.map((row, index) => (
          <div key={row} className="flex flex-wrap items-start gap-2">
            <ProductLine
              products={products}
              category={category}
              available={available}
              picked={picked[row]}
              autoFocus={row === added}
              position={index + 1}
              onPick={(product) => setPicked((current) => ({ ...current, [row]: product }))}
              onRemove={rows.length > 1 ? () => setRows(rows.filter((r) => r !== row)) : undefined}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => {
            const row = crypto.randomUUID();
            setRows([...rows, row]);
            setAdded(row);
          }}
        >
          Satır ekle
        </Button>
      </div>
    </div>
  );
}

function CategoryButton({ name, count, active, colored, onClick }: { name: string; count: number; active: boolean; colored?: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      aria-pressed={active}
      className="justify-between gap-2 font-normal"
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-2">
        {colored && <CategoryDot category={name} />}
        <span className="truncate">{name}</span>
      </span>
      <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
    </Button>
  );
}

function ProductLine({
  products,
  category,
  available,
  picked,
  autoFocus,
  position,
  onPick,
  onRemove,
}: {
  products: PickableProduct[];
  category?: string;
  available?: Available;
  picked?: PickableProduct;
  autoFocus: boolean;
  position: number;
  onPick: (product: PickableProduct | undefined) => void;
  onRemove?: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const quantity = useRef<HTMLInputElement>(null);
  const listId = useId();
  const showResults = open && !picked;
  const { kind, items } = searchProducts(products, typed, { category, available });
  const active = Math.min(activeIndex, items.length - 1);
  const optionId = (index: number) => `${listId}-${index}`;
  const hasStock = (product: PickableProduct) => Number(available?.[product.id] ?? 0) > 0;
  const stockOf = (product: PickableProduct) => `${formatQuantity(available?.[product.id] ?? "0")} ${unitLabels[product.unit]}`;
  const note = heading(kind, typed.trim());

  useEffect(() => {
    if (showResults) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId only depends on listId, which never changes.
  }, [active, showResults]);

  function pick(product: PickableProduct) {
    onPick(product);
    setTyped("");
    setOpen(false);
    quantity.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      // Enter here chooses a product; it must never submit a half-filled form.
      event.preventDefault();
      if (picked) quantity.current?.focus();
      else if (showResults && items[active]) pick(items[active]);
      else setOpen(true);
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!showResults) return setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((active + step + items.length) % Math.max(items.length, 1));
    }
  }

  return (
    <>
      <div className="relative flex min-w-64 flex-1 flex-col gap-1">
        <Input
          role="combobox"
          aria-label={`Ürün ${position}`}
          aria-expanded={showResults}
          aria-controls={listId}
          aria-activedescendant={showResults && items[active] ? optionId(active) : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          data-unpicked={picked ? undefined : ""}
          placeholder="Ürün adı, kategori veya kod yazın"
          value={picked ? label(picked) : typed}
          onChange={(event) => {
            if (picked) onPick(undefined);
            setTyped(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={(event) => {
            setOpen(true);
            if (picked) event.currentTarget.select();
          }}
          onBlur={() => {
            setOpen(false);
            // A fully typed code, or the only result left, counts as chosen, so Tab works as well as Enter.
            if (!picked && typed.trim() && (kind === "exact" || (kind === "matches" && items.length === 1))) {
              onPick(items[0]);
              setTyped("");
            }
          }}
          onKeyDown={onKeyDown}
        />
        {picked && (
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={picked.category} />
            {available && (
              <p className={cn("text-xs", hasStock(picked) ? "text-muted-foreground" : "text-destructive")}>
                {hasStock(picked) ? `Kullanılabilir: ${stockOf(picked)}` : "Bu lokasyonda kullanılabilir stok yok."}
              </p>
            )}
          </div>
        )}
        {!picked && !open && typed.trim() && <p className="text-destructive text-xs">Ürün seçilmedi. Listeden bir ürün seçin.</p>}
        {showResults && (
          // Keeps focus in the input while a result is clicked.
          <div
            className="bg-popover text-popover-foreground absolute top-10 left-0 z-50 w-full min-w-72 rounded-md border shadow-md"
            onMouseDown={(event) => event.preventDefault()}
          >
            {note && <p className="text-muted-foreground border-b px-3 py-2 text-xs">{note}</p>}
            <ul id={listId} role="listbox" aria-label="Ürünler" className="max-h-72 overflow-y-auto p-1">
              {items.map((product, index) => (
                <li
                  key={product.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  className={cn("flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm", index === active && "bg-accent text-accent-foreground")}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pick(product)}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-muted-foreground font-mono text-xs">{product.code}</span>
                  </span>
                  <CategoryBadge category={product.category} />
                  {kind === "exact" && index === 0 && <span className="shrink-0 text-xs font-medium">Birebir</span>}
                  {available && (
                    <span className={cn("shrink-0 text-xs tabular-nums", !hasStock(product) && "text-muted-foreground")}>
                      {hasStock(product) ? stockOf(product) : "Stok yok"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <input type="hidden" name="productId" value={picked?.id ?? ""} />
      <Input ref={quantity} name="quantity" inputMode="decimal" placeholder="Miktar" aria-label={`Miktar ${position}`} className="w-28" required />
      <span className="text-muted-foreground w-12 py-2 text-sm">{picked ? unitLabels[picked.unit] : ""}</span>
      {onRemove && (
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Kaldır
        </Button>
      )}
    </>
  );
}
