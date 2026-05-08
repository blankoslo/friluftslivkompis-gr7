"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchBox } from "@/components/discover/search-box";
import { CabinPanel } from "@/components/discover/cabin-panel";
import { FilterPanel } from "@/components/discover/filter-panel";
import { TripList } from "@/components/discover/trip-list";
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
      <div className="flex h-full w-full items-center justify-center rounded-md bg-surface text-sm text-muted-foreground">
        Laster kart…
      </div>
    ),
  },
);

const FETCH_DEBOUNCE_MS = 500;
const MAX_RADIUS_M = 200_000;

type Viewport = { lon: number; lat: number; radiusMeters: number };

export default function DiscoverPage() {
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [activeCabinId, setActiveCabinId] = useState<number | null>(null);
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [trips, setTrips] = useState<TripNearItem[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<TripCategory>>(
    () => new Set(),
  );
  const [minAge, setMinAge] = useState<AgeFilter>(null);
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
    <main className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Discover
        </h1>
        <p className="text-muted-foreground">
          Søk etter områder, hytter, fjelltopper og turforslag i hele Norge.
          Pan kartet, så finner Lars turer i området.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3">
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
            <SelectedDetails selected={selected} />
          ) : (
            <Legend />
          )}
        </div>

        <div className="h-[70vh] min-h-[420px] overflow-hidden rounded-md border border-border">
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
    </main>
  );
}

function SelectedDetails({ selected }: { selected: SearchResult }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4 text-sm">
      <div className="mb-1 font-heading font-semibold text-foreground">{selected.name}</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <dt>Type</dt>
        <dd className="text-foreground">
          {selected.subtype ?? selected.kind}
        </dd>
        {selected.municipality && (
          <>
            <dt>Kommune</dt>
            <dd className="text-foreground">{selected.municipality}</dd>
          </>
        )}
        {selected.county && (
          <>
            <dt>Fylke</dt>
            <dd className="text-foreground">{selected.county}</dd>
          </>
        )}
        <dt>Koordinater</dt>
        <dd className="font-mono text-foreground">
          {selected.lat.toFixed(5)}, {selected.lon.toFixed(5)}
        </dd>
        <dt>Kilde</dt>
        <dd className="text-foreground">
          {selected.source === "ut" ? "UT.no / DNT" : "Kartverket"}
        </dd>
      </dl>
    </div>
  );
}

function Legend() {
  return (
    <div className="rounded-md border border-border bg-surface p-4 text-xs text-muted-foreground">
      <div className="mb-2 font-heading font-semibold text-foreground">Tegnforklaring</div>
      <ul className="space-y-1.5">
        <li className="flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full border-2 border-white"
            style={{ background: "#cc1f2c" }}
          />
          DNT-hytte (zoom inn for å se)
        </li>
        <li className="flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full border-2 border-white"
            style={{ background: "#0f766e" }}
          />
          Turforslag fra UT.no
        </li>
        <li>
          Tilgjengelige kategorier: {TRIP_CATEGORIES.map((c) => CATEGORY_LABEL[c]).join(", ")}.
        </li>
      </ul>
    </div>
  );
}
