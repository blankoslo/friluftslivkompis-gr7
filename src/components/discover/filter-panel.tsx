"use client";

import { cn } from "@/lib/utils";
import {
  CATEGORY_DESCRIPTION,
  CATEGORY_LABEL,
  TRIP_CATEGORIES,
  type TripCategory,
} from "@/lib/discover/categories";
import {
  AGE_BAND_HINT,
  AGE_BAND_LABEL,
  AGE_BANDS,
  type AgeFilter,
} from "@/lib/discover/age";

type Props = {
  active: ReadonlySet<TripCategory>;
  counts: Record<TripCategory, number>;
  onToggle: (cat: TripCategory) => void;
  onClear: () => void;
  total: number;
  filteredTotal: number;
  loading: boolean;
  minAge: AgeFilter;
  onMinAgeChange: (band: AgeFilter) => void;
};

export function FilterPanel({
  active,
  counts,
  onToggle,
  onClear,
  total,
  filteredTotal,
  loading,
  minAge,
  onMinAgeChange,
}: Props) {
  const hasAnyFilter = active.size > 0 || minAge !== null;

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-heading text-sm font-semibold text-foreground">
          Filtrer turforslag
        </div>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => {
              onClear();
              onMinAgeChange(null);
            }}
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
                  ? "border-flame bg-flame text-white"
                  : "border-border bg-background text-foreground hover:border-flame/50",
                disabled && "cursor-not-allowed opacity-40 hover:border-border",
              )}
            >
              {CATEGORY_LABEL[cat]}
              <span
                className={cn(
                  "ml-1.5 rounded-sm px-1 text-[10px]",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="mb-1.5 text-xs font-medium text-foreground">
          Yngste deltaker
        </div>
        <div className="flex flex-wrap gap-1.5">
          <AgeChip
            label="Bare voksne"
            active={minAge === null}
            onClick={() => onMinAgeChange(null)}
          />
          {AGE_BANDS.map((band) => (
            <AgeChip
              key={band}
              label={AGE_BAND_LABEL[band]}
              hint={AGE_BAND_HINT[band]}
              active={minAge === band}
              onClick={() => onMinAgeChange(band)}
            />
          ))}
        </div>
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

function AgeChip({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-flame bg-flame text-white"
          : "border-border bg-background text-foreground hover:border-flame/50",
      )}
    >
      {label}
    </button>
  );
}

