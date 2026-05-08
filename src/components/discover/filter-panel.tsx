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
    <div className="rounded-lg border-2 border-flame-pressed bg-bg p-md shadow-[4px_4px_0_var(--brand-flame-pressed)]">
      <div className="mb-sm flex items-center justify-between">
        <div
          className="text-flame-pressed"
          style={{ fontFamily: "var(--font-handwriting)", fontSize: "22px" }}
        >
          Filtrer turforslag
        </div>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => {
              onClear();
              onMinAgeChange(null);
            }}
            className="text-xs font-bold uppercase tracking-label text-flame-primary underline-offset-2 hover:underline"
          >
            Nullstill
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-xs">
        {TRIP_CATEGORIES.map((cat) => {
          const isActive = active.has(cat);
          const count = counts[cat];
          const disabled = !isActive && count === 0 && total > 0;
          return (
            <FilterChip
              key={cat}
              active={isActive}
              disabled={disabled}
              title={CATEGORY_DESCRIPTION[cat]}
              onClick={() => onToggle(cat)}
              label={CATEGORY_LABEL[cat]}
              count={count}
            />
          );
        })}
      </div>

      <div className="mt-md border-t-2 border-flame-pressed/20 pt-md">
        <div className="mb-sm text-xs font-bold uppercase tracking-label text-text-primary">
          Yngste deltaker
        </div>
        <div className="flex flex-wrap gap-xs">
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

      <div className="mt-md text-xs text-text-muted">
        {loading ? (
          <span
            style={{
              fontFamily: "var(--font-handwriting)",
              fontSize: "16px",
            }}
            className="text-flame-pressed"
          >
            Lars leter etter turer...
          </span>
        ) : total === 0 ? (
          "Ingen turforslag i området. Pan kartet for å finne flere."
        ) : (
          `Viser ${filteredTotal} av ${total} turer i kartområdet.`
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  disabled,
  title,
  onClick,
  label,
  count,
}: {
  active: boolean;
  disabled: boolean;
  title: string;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border-2 px-sm py-1 text-xs font-bold transition-transform",
        active
          ? "border-white bg-flame-pressed text-white shadow-[2px_2px_0_var(--brand-flame-pressed)]"
          : "border-flame-pressed bg-bg text-flame-pressed shadow-[2px_2px_0_var(--brand-flame-pressed)] hover:translate-y-[1px]",
        disabled && "cursor-not-allowed opacity-40 hover:translate-y-0",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-sm px-1 text-[10px]",
          active ? "bg-white/20 text-white" : "bg-flame-tint text-flame-pressed",
        )}
      >
        {count}
      </span>
    </button>
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
        "rounded-pill border-2 px-sm py-1 text-xs font-bold transition-transform",
        active
          ? "border-white bg-flame-pressed text-white shadow-[2px_2px_0_var(--brand-flame-pressed)]"
          : "border-flame-pressed bg-bg text-flame-pressed shadow-[2px_2px_0_var(--brand-flame-pressed)] hover:translate-y-[1px]",
      )}
    >
      {label}
    </button>
  );
}
