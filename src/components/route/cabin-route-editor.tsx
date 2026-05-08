"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Search, X, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CabinPoint, RouteLeg } from "@/lib/route";
import type { SearchResponse, SearchResult } from "@/lib/search/types";

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

const DEBOUNCE_MS = 220;
const MIN_CHARS = 2;

function parseUtId(searchId: string): number | undefined {
  const match = /^ut:cabin:(\d+)$/.exec(searchId);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : undefined;
}

// ── Cabin search hook ──────────────────────────────────────────────────────

function useCabinSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_CHARS) {
      void Promise.resolve().then(() => setResults([]));
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=12`,
          { signal: ctrl.signal },
        );
        const data = (await res.json()) as SearchResponse;
        const cabins = (data.results ?? []).filter(
          (r) => r.kind === "cabin" || r.kind === "place",
        );
        setResults(cabins);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed]);

  return { query, setQuery, results, loading, open, setOpen };
}

// ── Route fetch hook ────────────────────────────────────────────────────────

function useRoute(initialCabins: CabinPoint[]) {
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
    void Promise.resolve().then(() => fetchRoute(initialCabins));
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { legs, totals, loading, fetchRoute };
}

// ── Main component ──────────────────────────────────────────────────────────

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
  const { legs, totals, loading: routeLoading, fetchRoute } = useRoute(initialCabins);
  const search = useCabinSearch();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!searchContainerRef.current?.contains(e.target as Node)) {
        search.setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [search]);

  async function persist(next: CabinPoint[]) {
    if (isDemo) return;
    await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cabins: next }),
    });
    startTransition(() => router.refresh());
  }

  function addCabin(r: SearchResult) {
    if (cabins.some((c) => c.name === r.name && Math.abs(c.lat - r.lat) < 0.001)) return;
    const utId = parseUtId(r.id);
    const cabin: CabinPoint = {
      name: r.name,
      lat: r.lat,
      lon: r.lon,
      ...(utId != null ? { utId } : {}),
    };
    const next = [...cabins, cabin];
    setCabins(next);
    fetchRoute(next);
    persist(next);
    search.setQuery("");
    search.setOpen(false);
  }

  function removeCabin(i: number) {
    const next = cabins.filter((_, idx) => idx !== i);
    setCabins(next);
    fetchRoute(next);
    persist(next);
  }

  function move(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= cabins.length) return;
    const next = [...cabins];
    [next[i], next[target]] = [next[target], next[i]];
    setCabins(next);
    fetchRoute(next);
    persist(next);
  }

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    const visible = search.results.filter((r) => !cabins.some((c) => c.name === r.name));
    if (!search.open || visible.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visible[activeIdx]) addCabin(visible[activeIdx]);
    } else if (e.key === "Escape") {
      search.setOpen(false);
    }
  }

  const visibleResults = search.results.filter(
    (r) => !cabins.some((c) => c.name === r.name),
  );
  const showDropdown =
    search.open && search.query.trim().length >= MIN_CHARS && (search.loading || visibleResults.length > 0);

  return (
    <div className="flex flex-col gap-md">

      {/* ── Cabin search ── */}
      {!isDemo && (
        <div ref={searchContainerRef} className="relative">
          <div
            className="flex items-center gap-sm bg-bg border-2 border-flame-pressed rounded-lg px-md py-sm"
            style={{ boxShadow: "3px 3px 0 var(--brand-flame-pressed)" }}
          >
            <Search className="w-4 h-4 text-flame shrink-0" />
            <input
              type="search"
              value={search.query}
              placeholder="Søk etter hytte og legg til i ruten…"
              autoComplete="off"
              onChange={(e) => { search.setQuery(e.target.value); search.setOpen(true); setActiveIdx(0); }}
              onFocus={() => search.setOpen(true)}
              onKeyDown={handleSearchKey}
              className="flex-1 bg-transparent text-body font-semibold text-text-primary placeholder:text-text-muted outline-none"
            />
            {search.loading && (
              <span className="text-xs text-text-muted animate-pulse">Søker…</span>
            )}
          </div>

          {showDropdown && (
            <ul
              className="absolute z-30 mt-1 w-full bg-bg rounded-lg overflow-hidden border-2 border-flame-pressed"
              style={{ boxShadow: "4px 4px 0 var(--brand-flame-pressed)" }}
            >
              {!search.loading && visibleResults.length === 0 && (
                <li className="px-md py-sm text-sm text-text-muted">
                  Ingen hytter funnet — prøv et annet navn.
                </li>
              )}
              {visibleResults.map((r, i) => (
                <li
                  key={r.id}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => { e.preventDefault(); addCabin(r); }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-sm px-md py-sm text-sm border-b border-flame-pressed/20 last:border-0",
                    i === activeIdx ? "bg-flame-tint" : "hover:bg-flame-tint/60",
                  )}
                >
                  <span className="flex items-center gap-sm">
                    <Plus className="w-3 h-3 text-flame shrink-0" />
                    <span className="font-semibold text-text-primary truncate">{r.name}</span>
                  </span>
                  <span className="shrink-0 text-xs px-sm py-0.5 rounded bg-surface text-text-muted">
                    {r.dntCabin ? "DNT" : r.kind === "cabin" ? "Hytte" : r.subtype ?? "Sted"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {cabins.length === 0 && (
        <p
          className="text-lg text-text-primary leading-snug py-sm"
          style={{ fontFamily: "var(--font-handwriting)" }}
        >
          Søk etter startpunkt og legg til hytter i rekkefølge ↑
        </p>
      )}

      {cabins.length === 1 && (
        <p
          className="text-base text-text-muted leading-snug"
          style={{ fontFamily: "var(--font-handwriting)" }}
        >
          Legg til én hytte til for å beregne ruten.
        </p>
      )}

      {/* ── Ordered cabin list ── */}
      {cabins.length > 0 && (
        <ol className="flex flex-col gap-sm">
          {cabins.map((cabin, i) => (
            <li
              key={`${cabin.name}-${i}`}
              className="flex items-center gap-sm rounded-md border-2 border-flame-pressed bg-bg px-md py-sm"
              style={{ boxShadow: "2px 2px 0 var(--brand-flame-pressed)" }}
            >
              <span
                className="w-5 text-center text-xs font-bold text-text-muted uppercase tracking-label shrink-0"
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                {i + 1}
              </span>

              <span className="flex-1 font-heading font-bold text-body text-text-primary">
                {cabin.name}
              </span>

              {i < cabins.length - 1 && (
                <span className="text-flame text-sm font-bold shrink-0">→</span>
              )}

              {/* Reorder */}
              {!isDemo && (
                <span className="flex gap-xs shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Flytt ${cabin.name} opp`}
                    className="w-6 h-6 flex items-center justify-center rounded border-2 border-flame-pressed text-flame-pressed disabled:opacity-20 hover:bg-flame-tint transition-colors"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === cabins.length - 1}
                    aria-label={`Flytt ${cabin.name} ned`}
                    className="w-6 h-6 flex items-center justify-center rounded border-2 border-flame-pressed text-flame-pressed disabled:opacity-20 hover:bg-flame-tint transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Remove */}
              {!isDemo && (
                <button
                  onClick={() => removeCabin(i)}
                  aria-label={`Fjern ${cabin.name}`}
                  className="w-6 h-6 flex items-center justify-center rounded border-2 border-flame-pressed text-flame-pressed hover:bg-warning-bg hover:border-warning hover:text-warning transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* ── Summary totals ── */}
      {totals && !routeLoading && (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-md p-md rounded-md border-2 border-flame-pressed bg-bg"
          style={{ boxShadow: "4px 4px 0 var(--brand-flame-pressed)" }}
        >
          <StatBlock label="Etapper" value={String(legs.length)} />
          <StatBlock label="Distanse" value={totals.distanceKm.toFixed(1)} unit="km" />
          <StatBlock label="Stigning" value={String(totals.elevationGain)} unit="m" />
          <StatBlock label="Estimert tid" value={totals.estimatedHours.toFixed(1)} unit="t" />
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {routeLoading && cabins.length >= 2 && (
        <div className="flex flex-col gap-sm">
          <div
            className="grid grid-cols-4 gap-md p-md rounded-md border-2 border-flame-pressed bg-bg animate-pulse"
          >
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
              <div className="h-10 bg-flame-pressed/70" />
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

      {/* ── Per-leg cards ── */}
      {!routeLoading && legs.map((leg) => (
        <article
          key={leg.dayNumber}
          className="rounded-lg border-4 border-flame-pressed bg-bg overflow-hidden"
          style={{ boxShadow: "4px 4px 0 var(--brand-flame-pressed)" }}
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
                Høydedata mangler for denne etappen.
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
