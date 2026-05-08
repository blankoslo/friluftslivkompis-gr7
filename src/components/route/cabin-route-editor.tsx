"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CabinPoint, RouteLeg } from "@/lib/route";

type Totals = {
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  estimatedHours: number;
};

const DIFFICULTY_LABEL: Record<RouteLeg["difficulty"], string> = {
  easy: "Lett",
  moderate: "Middels",
  tough: "Krevende",
};

const DIFFICULTY_STYLES: Record<RouteLeg["difficulty"], string> = {
  easy: "bg-forest text-white",
  moderate: "bg-fjord text-white",
  tough: "bg-flame-hover text-white",
};

export function CabinRouteEditor({
  initialCabins,
  tripId,
  isDemo,
}: {
  initialCabins: CabinPoint[];
  tripId: string;
  isDemo: boolean;
}) {
  const router = useRouter();
  const [cabins, setCabins] = useState<CabinPoint[]>(initialCabins);
  const [legs, setLegs] = useState<RouteLeg[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRoute = useCallback(async (pts: CabinPoint[]) => {
    if (pts.length < 2) {
      setLegs([]);
      setTotals(null);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cabins: pts }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("route-api-error");
      const data = await res.json();
      if (!ctrl.signal.aborted) {
        setLegs(data.legs ?? []);
        setTotals(data.totals ?? null);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setLegs([]);
        setTotals(null);
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoute(initialCabins);
    return () => abortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function move(index: number, dir: -1 | 1) {
    const next = [...cabins];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCabins(next);
    fetchRoute(next);
    if (!isDemo) {
      await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cabins: next }),
      });
      startTransition(() => router.refresh());
    }
  }

  if (cabins.length < 2) {
    return (
      <p
        className="text-text-primary text-lg leading-snug"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        Legg til minst to hytter for å beregne ruten.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {/* Ordered cabin list */}
      <ol className="flex flex-col gap-sm">
        {cabins.map((cabin, i) => (
          <li
            key={`${cabin.name}-${i}`}
            className="flex items-center gap-sm rounded-md border-2 border-flame-pressed bg-bg px-md py-sm shadow-[2px_2px_0_var(--brand-flame-pressed)]"
          >
            <span
              className="w-6 text-center text-xs font-bold text-text-muted uppercase tracking-label shrink-0"
              style={{ fontFamily: "var(--font-stamp)" }}
            >
              {i + 1}
            </span>
            <span className="flex-1 font-heading font-bold text-body text-text-primary">
              {cabin.name}
            </span>
            {i < cabins.length - 1 && (
              <span className="text-flame-primary text-sm font-bold">→</span>
            )}
            <span className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Flytt ${cabin.name} opp`}
                className="w-6 h-6 flex items-center justify-center rounded border-2 border-flame-pressed text-flame-pressed text-xs font-bold leading-none disabled:opacity-20 hover:bg-flame-tint transition-colors"
              >
                ↑
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === cabins.length - 1}
                aria-label={`Flytt ${cabin.name} ned`}
                className="w-6 h-6 flex items-center justify-center rounded border-2 border-flame-pressed text-flame-pressed text-xs font-bold leading-none disabled:opacity-20 hover:bg-flame-tint transition-colors"
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>

      {/* Summary totals */}
      {totals && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md p-md rounded-md border-2 border-flame-pressed bg-bg shadow-[4px_4px_0_var(--brand-flame-pressed)]">
          <StatBlock label="Etapper" value={String(legs.length)} />
          <StatBlock label="Distanse" value={totals.distanceKm.toFixed(1)} unit="km" />
          <StatBlock label="Stigning" value={String(totals.elevationGain)} unit="m" />
          <StatBlock label="Estimert tid" value={totals.estimatedHours.toFixed(1)} unit="t" />
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="flex flex-col gap-sm">
          <div className="grid grid-cols-4 gap-md p-md rounded-md border-2 border-flame-pressed bg-bg animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-xs">
                <div className="h-3 bg-flame-tint/60 rounded w-2/3" />
                <div className="h-6 bg-flame-tint/40 rounded w-1/2" />
              </div>
            ))}
          </div>
          {Array.from({ length: cabins.length - 1 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border-2 border-flame-pressed bg-bg overflow-hidden animate-pulse"
            >
              <div className="h-10 bg-flame-pressed/80" />
              <div className="grid grid-cols-3 gap-md p-md">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex flex-col gap-xs">
                    <div className="h-3 bg-flame-tint/60 rounded w-2/3" />
                    <div className="h-6 bg-flame-tint/40 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-leg cards */}
      {!loading && legs.map((leg) => (
        <article
          key={leg.dayNumber}
          className="rounded-lg border-4 border-flame-pressed bg-bg shadow-[4px_4px_0_var(--brand-flame-pressed)] overflow-hidden"
        >
          <header className="flex items-center justify-between gap-md px-md py-sm bg-flame-pressed text-white">
            <span className="font-heading text-body font-bold">
              Etappe {leg.dayNumber}
              <span className="font-body font-normal opacity-90 ml-sm text-sm">
                {leg.from.name} → {leg.to.name}
              </span>
            </span>
            <span
              className={cn(
                "text-xs font-bold px-sm py-1 rounded-pill uppercase tracking-label shrink-0",
                DIFFICULTY_STYLES[leg.difficulty],
              )}
              style={{ fontFamily: "var(--font-stamp)" }}
            >
              {DIFFICULTY_LABEL[leg.difficulty]}
            </span>
          </header>

          <div className="p-md flex flex-col gap-sm">
            <div className="grid grid-cols-3 gap-md">
              <StatBlock label="Distanse" value={leg.distanceKm.toFixed(1)} unit="km" />
              <StatBlock
                label="Stigning"
                value={leg.hasElevationData ? String(leg.elevationGain) : "–"}
                unit={leg.hasElevationData ? "m" : undefined}
              />
              <StatBlock label="Tid" value={leg.estimatedHours.toFixed(1)} unit="t" />
            </div>

            {leg.difficulty === "tough" && leg.elevationGain >= 1000 && (
              <p
                className="text-sm font-semibold text-flame-hover"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                ⚠ Over 1 000 høydemeter — krevende for mange grupper
              </p>
            )}

            {!leg.hasElevationData && (
              <p
                className="text-sm text-text-muted"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                Høydedata mangler. Bruk kart for verifikasjon.
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function StatBlock({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <span
        className="text-small uppercase tracking-label text-flame-pressed font-bold"
        style={{ fontFamily: "var(--font-stamp)" }}
      >
        {label}
      </span>
      <span className="font-heading text-h3 font-bold text-text-primary">
        {value}
        {unit && <span className="text-text-muted text-body ml-1">{unit}</span>}
      </span>
    </div>
  );
}
