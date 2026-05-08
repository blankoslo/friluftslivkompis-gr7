"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBox } from "@/components/discover/search-box";
import { CabinPanel } from "@/components/discover/cabin-panel";
import { FilterPanel } from "@/components/discover/filter-panel";
import { TripList } from "@/components/discover/trip-list";
import { MonsenToast } from "@/components/lars-monsen/monsen-toast";
import { randomQuip } from "@/lib/lars-monsen/quips";
import type { SearchResult } from "@/lib/search/types";
import type { TripNearItem } from "@/lib/ut";
import {
  CATEGORY_LABEL,
  TRIP_CATEGORIES,
  categoryCounts,
  filterTrips,
  suggestRemoval,
  type TripCategory,
} from "@/lib/discover/categories";
import { filterByAge, type AgeFilter } from "@/lib/discover/age";

const Map = dynamic(
  () => import("@/components/discover/map").then((m) => m.Map),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full w-full items-center justify-center bg-bg text-flame-pressed"
        style={{ fontFamily: "var(--font-handwriting)", fontSize: "20px" }}
      >
        Laster kartet, hold ut...
      </div>
    ),
  },
);

const FETCH_DEBOUNCE_MS = 500;
const MAX_RADIUS_M = 200_000;

type Viewport = { lon: number; lat: number; radiusMeters: number };

export default function DiscoverPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [activeCabinId, setActiveCabinId] = useState<number | null>(null);
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [trips, setTrips] = useState<TripNearItem[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<TripCategory>>(
    () => new Set(),
  );
  const [minAge, setMinAge] = useState<AgeFilter>(null);
  const [monsenQuip, setMonsenQuip] = useState<{ id: number; text: string } | null>(null);
  const [heroQuip] = useState(() => randomQuip("discoverHero"));
  const viewportRef = useRef<Viewport | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const handleSelect = useCallback((r: SearchResult) => {
    setSelected(r);
    setActiveTripId(null);
    if (r.kind === "cabin" && r.source === "ut") {
      setActiveCabinId(r.id.startsWith("ut:cabin:") ? Number(r.id.slice(9)) : null);
    } else {
      setActiveCabinId(null);
    }
  }, []);

  const handleCabinClick = useCallback((id: number) => {
    setActiveCabinId(id);
    setActiveTripId(null);
    setMonsenQuip({ id: Date.now(), text: randomQuip("cabinSelect") });
  }, []);

  const fetchTrips = useCallback((v: Viewport) => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setTripsLoading(true);

    const radius = Math.min(v.radiusMeters, MAX_RADIUS_M);
    const url = `/api/trips/near?lon=${v.lon.toFixed(5)}&lat=${v.lat.toFixed(5)}&radius=${radius}`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { trips?: TripNearItem[]; error?: string }) => {
        if (controller.signal.aborted) return;
        setTrips(Array.isArray(data.trips) ? data.trips : []);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        console.error("[discover trips fetch]", err);
        setTrips([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setTripsLoading(false);
      });
  }, []);

  const debounceRef = useRef<number | null>(null);
  const handleViewportChange = useCallback(
    (v: Viewport) => {
      viewportRef.current = v;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        fetchTrips(v);
      }, FETCH_DEBOUNCE_MS);
    },
    [fetchTrips],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      fetchAbortRef.current?.abort();
    };
  }, []);

  const ageFilteredTrips = useMemo(
    () => filterByAge(trips, minAge),
    [trips, minAge],
  );
  const filteredTrips = useMemo(
    () => filterTrips(ageFilteredTrips, activeFilters),
    [ageFilteredTrips, activeFilters],
  );
  const counts = useMemo(
    () => categoryCounts(ageFilteredTrips),
    [ageFilteredTrips],
  );
  const removalSuggestion = useMemo(
    () => suggestRemoval(ageFilteredTrips, activeFilters),
    [ageFilteredTrips, activeFilters],
  );

  const toggleFilter = useCallback((cat: TripCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  const handleTripSelect = useCallback((t: TripNearItem) => {
    setActiveTripId(t.id);
    setActiveCabinId(null);
    setMonsenQuip({ id: Date.now(), text: randomQuip("tripSelect") });
    setSelected({
      source: "ut",
      kind: "trip",
      id: `ut:trip:${t.id}`,
      name: t.name,
      lat: t.lat,
      lon: t.lon,
      subtype: t.primaryActivityType,
      municipality: null,
      county: null,
      dntCabin: null,
    });
  }, []);

  const handleTripClickFromMap = useCallback(
    (id: number) => {
      const t = trips.find((x) => x.id === id);
      if (t) handleTripSelect(t);
    },
    [trips, handleTripSelect],
  );

  const handleCreateTrip = useCallback(
    async (name: string, area?: string) => {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name, area: area ?? "", phase: "gather" }),
      });
      if (!res.ok) return;
      const trip = await res.json();
      router.push(`/tur/${trip._id}`);
    },
    [router],
  );

  const removeMostRestrictive = useCallback(() => {
    if (!removalSuggestion) return;
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.delete(removalSuggestion);
      return next;
    });
  }, [removalSuggestion]);

  const showCabinPanel = activeCabinId !== null;
  const hasFilters = activeFilters.size > 0 || minAge !== null;
  const showTripList = trips.length > 0 || hasFilters;
  const showEmptyHint =
    filteredTrips.length === 0 && ageFilteredTrips.length > 0;

  return (
    <main className="bg-bg text-text-primary min-h-screen">
      <div className="mx-auto max-w-5xl px-md py-lg sm:px-lg sm:py-xl">
        <header className="mb-lg">
          <h1 className="font-heading text-3xl font-bold text-text-primary sm:text-4xl">
            Finn turen
          </h1>
          <p
            className="mt-xs text-flame-pressed"
            style={{
              fontFamily: "var(--font-handwriting)",
              fontSize: "20px",
              transform: "rotate(-0.5deg)",
              display: "inline-block",
            }}
          >
            {heroQuip} ↓
          </p>
        </header>

        <div className="grid gap-md lg:grid-cols-[360px_1fr]">
          <div className="order-2 space-y-md lg:order-1">
            <SearchBox selected={selected} onSelect={handleSelect} />

            <FilterPanel
              active={activeFilters}
              counts={counts}
              onToggle={toggleFilter}
              onClear={clearFilters}
              total={ageFilteredTrips.length}
              filteredTotal={filteredTrips.length}
              loading={tripsLoading}
              minAge={minAge}
              onMinAgeChange={setMinAge}
            />

            {showCabinPanel ? (
              <CabinPanel
                key={activeCabinId}
                cabinId={activeCabinId!}
                onClose={() => setActiveCabinId(null)}
              />
            ) : showTripList ? (
              <TripList
                trips={filteredTrips}
                activeId={activeTripId}
                minAge={minAge}
                onSelect={handleTripSelect}
                onCreateTrip={(t) => handleCreateTrip(t.name)}
                emptySuggestion={
                  showEmptyHint && removalSuggestion
                    ? CATEGORY_LABEL[removalSuggestion]
                    : null
                }
                onClearSuggestion={
                  showEmptyHint && removalSuggestion
                    ? removeMostRestrictive
                    : undefined
                }
              />
            ) : selected ? (
              <SelectedDetails
                selected={selected}
                onCreateTrip={() => handleCreateTrip(selected.name, selected.municipality ?? undefined)}
              />
            ) : (
              <Legend />
            )}
          </div>

          <div className="order-1 h-[50vh] min-h-[320px] overflow-hidden rounded-lg border-4 border-flame-pressed shadow-[6px_6px_0_var(--brand-flame-pressed)] lg:order-2 lg:h-[70vh] lg:min-h-[420px]">
            <Map
              selected={selected}
              trips={filteredTrips}
              activeTripId={activeTripId}
              onCabinClick={handleCabinClick}
              onTripClick={handleTripClickFromMap}
              onViewportChange={handleViewportChange}
            />
          </div>
        </div>
      </div>
      <MonsenToast trigger={monsenQuip?.id ?? null} quip={monsenQuip?.text ?? null} />
    </main>
  );
}

function SelectedDetails({
  selected,
  onCreateTrip,
}: {
  selected: SearchResult;
  onCreateTrip: () => void;
}) {
  return (
    <div className="rounded-lg border-2 border-flame-pressed bg-bg p-md text-sm shadow-[4px_4px_0_var(--brand-flame-pressed)]">
      <div className="mb-xs font-heading text-base font-bold text-text-primary">
        {selected.name}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-sm gap-y-1 text-xs text-text-muted">
        <dt>Type</dt>
        <dd className="text-text-primary">
          {selected.subtype ?? selected.kind}
        </dd>
        {selected.municipality && (
          <>
            <dt>Kommune</dt>
            <dd className="text-text-primary">{selected.municipality}</dd>
          </>
        )}
        {selected.county && (
          <>
            <dt>Fylke</dt>
            <dd className="text-text-primary">{selected.county}</dd>
          </>
        )}
        <dt>Koordinater</dt>
        <dd className="font-mono text-text-primary">
          {selected.lat.toFixed(5)}, {selected.lon.toFixed(5)}
        </dd>
        <dt>Kilde</dt>
        <dd className="text-text-primary">
          {selected.source === "ut" ? "UT.no / DNT" : "Kartverket"}
        </dd>
      </dl>
      <button
        type="button"
        onClick={onCreateTrip}
        className="mt-md w-full rounded-md bg-flame-primary px-md py-sm text-sm font-bold text-white hover:bg-flame-hover active:bg-flame-pressed shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-transform"
      >
        Lag tur her →
      </button>
    </div>
  );
}

function Legend() {
  return (
    <div className="rounded-lg border-2 border-flame-pressed bg-bg p-md text-xs text-text-muted shadow-[4px_4px_0_var(--brand-flame-pressed)]">
      <div
        className="mb-sm text-flame-pressed"
        style={{ fontFamily: "var(--font-handwriting)", fontSize: "20px" }}
      >
        Tegnforklaring
      </div>
      <ul className="space-y-1.5">
        <li className="flex items-center gap-sm">
          <span className="inline-block size-3 rounded-full border-2 border-white bg-flame-primary" />
          <span className="text-text-primary">DNT-hytte (zoom inn for å se)</span>
        </li>
        <li className="flex items-center gap-sm">
          <span className="inline-block size-3 rounded-full border-2 border-white bg-forest" />
          <span className="text-text-primary">Turforslag fra UT.no</span>
        </li>
        <li className="pt-xs">
          Kategorier: {TRIP_CATEGORIES.map((c) => CATEGORY_LABEL[c]).join(", ")}.
        </li>
      </ul>
    </div>
  );
}
