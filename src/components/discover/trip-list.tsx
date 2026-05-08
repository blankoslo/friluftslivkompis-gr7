"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TripNearItem, TripActivityType, TripGrading } from "@/lib/ut";
import {
  AGE_BAND_LABEL,
  isChildUnfriendly,
  lowestSuitableAgeBand,
  unsuitabilityReason,
  type AgeFilter,
} from "@/lib/discover/age";
import { randomQuip } from "@/lib/lars-monsen/quips";

const ACTIVITY_LABEL: Record<TripActivityType, string> = {
  HIKING: "Fottur",
  SKI_TOURING: "Ski",
  PADLING: "Padling",
  CYCLING: "Sykkel",
  CLIMBING: "Klatring",
  GLACIER_TRIP: "Bre",
  BERRY_PICKING: "Bærtur",
};

const GRADING_LABEL: Record<TripGrading, string> = {
  EASY: "Lett",
  MODERATE: "Middels",
  TOUGH: "Krevende",
  VERY_TOUGH: "Ekspert",
};

type Props = {
  trips: TripNearItem[];
  activeId: number | null;
  minAge: AgeFilter;
  onSelect: (trip: TripNearItem) => void;
  emptySuggestion?: string | null;
  onClearSuggestion?: () => void;
};

export function TripList({
  trips,
  activeId,
  minAge,
  onSelect,
  emptySuggestion,
  onClearSuggestion,
}: Props) {
  if (trips.length === 0) {
    return <EmptyTripList emptySuggestion={emptySuggestion} onClearSuggestion={onClearSuggestion} />;
  }

  return (
    <ul className="max-h-80 space-y-1.5 overflow-auto rounded-md border border-border bg-surface p-2">
      {trips.map((t) => {
        const isActive = t.id === activeId;
        const lowestBand = lowestSuitableAgeBand(t);
        const childUnfriendly = isChildUnfriendly(t);
        const ageWarning = minAge ? unsuitabilityReason(t, minAge) : null;

        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onSelect(t)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition",
                isActive
                  ? "bg-foreground/10 ring-1 ring-foreground/30"
                  : "hover:bg-muted",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="truncate font-medium text-foreground">
                  {t.name}
                </div>
                {minAge === null && lowestBand && (
                  <AgeBadge tone="ok">Egnet {AGE_BAND_LABEL[lowestBand]}</AgeBadge>
                )}
                {minAge === null && !lowestBand && childUnfriendly && (
                  <AgeBadge tone="warn">Ikke barnevennlig</AgeBadge>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                {t.primaryActivityType && (
                  <span>{ACTIVITY_LABEL[t.primaryActivityType]}</span>
                )}
                {t.grading && <span>{GRADING_LABEL[t.grading]}</span>}
                {durationText(t) && <span>{durationText(t)}</span>}
                {t.tripDistance && (
                  <span>{(t.tripDistance / 1000).toFixed(1)} km</span>
                )}
              </div>
              {ageWarning && (
                <div className="mt-1 text-xs text-warning">
                  ⚠ {ageWarning}
                </div>
              )}
            </button>
            {isActive && (
              <Link
                href={`/offline/tur/${t.id}`}
                className="mt-1 inline-block px-3 text-xs text-fjord hover:underline"
              >
                Bruk offline →
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function EmptyTripList({
  emptySuggestion,
  onClearSuggestion,
}: {
  emptySuggestion?: string | null;
  onClearSuggestion?: () => void;
}) {
  const [quip] = useState(() => randomQuip("filterEmpty"));
  return (
    <div className="rounded-md border-2 border-flame-pressed bg-bg p-md text-sm shadow-[3px_3px_0_var(--brand-flame-pressed)]">
      <div className="mb-1 font-heading font-semibold text-text-primary">
        Ingen treff
      </div>
      <p
        className="text-base text-text-primary leading-snug"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
      >
        {quip}
      </p>
      <p className="mt-xs text-xs text-text-muted">
        Filtrene gir null treff i kartområdet.
      </p>
      {emptySuggestion && onClearSuggestion && (
        <button
          type="button"
          onClick={onClearSuggestion}
          className="mt-sm rounded-md border-2 border-flame-pressed bg-bg px-3 py-1.5 text-xs font-bold hover:bg-flame-tint"
        >
          Fjern «{emptySuggestion}» for å se flere
        </button>
      )}
    </div>
  );
}

function AgeBadge({
  tone,
  children,
}: {
  tone: "ok" | "warn";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
        tone === "ok"
          ? "bg-forest-tint text-forest"
          : "bg-warning-bg text-warning",
      )}
    >
      {children}
    </span>
  );
}

function durationText(t: TripNearItem): string | null {
  if (t.durationDays && t.durationDays > 0) {
    return t.durationDays === 1 ? "1 dag" : `${t.durationDays} dager`;
  }
  if (t.durationHours && t.durationHours > 0) {
    return `${t.durationHours} t`;
  }
  return null;
}
