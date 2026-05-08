"use client";

import { cn } from "@/lib/utils";
import {
  CATEGORY_DESCRIPTION,
  CATEGORY_LABEL,
  TRIP_CATEGORIES,
  type TripCategory,
} from "@/lib/discover/categories";

type Props = {
  active: ReadonlySet<TripCategory>;
  counts: Record<TripCategory, number>;
  onToggle: (cat: TripCategory) => void;
  onClear: () => void;
  total: number;
  filteredTotal: number;
  loading: boolean;
};

export function FilterPanel({
  active,
  counts,
  onToggle,
  onClear,
  total,
  filteredTotal,
  loading,
}: Props) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-heading text-sm font-semibold text-foreground">
          Filtrer turforslag
        </div>
        {active.size > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Nullstill
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TRIP_CATEGORIES.map((cat) => {
          const isActive = active.has(cat);
          const count = counts[cat];
          const disabled = !isActive && count === 0 && total > 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onToggle(cat)}
              disabled={disabled}
              aria-pressed={isActive}
              title={CATEGORY_DESCRIPTION[cat]}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/50",
                disabled && "cursor-not-allowed opacity-40 hover:border-border",
              )}
            >
              {CATEGORY_LABEL[cat]}
              <span
                className={cn(
                  "ml-1.5 rounded-sm px-1 text-[10px]",
                  isActive
                    ? "bg-background/20 text-background"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        {loading
          ? "Henter turforslag…"
          : total === 0
            ? "Ingen turforslag i området. Pan kartet for å finne flere."
            : `Viser ${filteredTotal} av ${total} turer i kartområdet.`}
      </div>
    </div>
  );
}
