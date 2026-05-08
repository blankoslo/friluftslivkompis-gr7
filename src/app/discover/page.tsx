"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { SearchBox } from "@/components/discover/search-box";
import { CabinPanel } from "@/components/discover/cabin-panel";
import type { SearchResult } from "@/lib/search/types";

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

export default function DiscoverPage() {
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [activeCabinId, setActiveCabinId] = useState<number | null>(null);

  const handleSelect = useCallback((r: SearchResult) => {
    setSelected(r);
    if (r.kind === "cabin" && r.source === "ut") {
      setActiveCabinId(r.id.startsWith("ut:cabin:") ? Number(r.id.slice(9)) : null);
    } else {
      setActiveCabinId(null);
    }
  }, []);

  const handleCabinClick = useCallback((id: number) => {
    setActiveCabinId(id);
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Discover</h1>
        <p className="text-muted-foreground">
          Søk etter områder, hytter, fjelltopper og turforslag i hele Norge.
          Zoom inn for å se DNT-hyttenettet.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          <SearchBox selected={selected} onSelect={handleSelect} />
          {activeCabinId !== null ? (
            <CabinPanel
              key={activeCabinId}
              cabinId={activeCabinId}
              onClose={() => setActiveCabinId(null)}
            />
          ) : selected ? (
            <SelectedDetails selected={selected} />
          ) : (
            <Legend />
          )}
        </div>

        <div className="h-[70vh] min-h-[420px] overflow-hidden rounded-md border border-border">
          <Map selected={selected} onCabinClick={handleCabinClick} />
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
        <li>Klikk en hytte for detaljer.</li>
        <li>Søk på området ditt over for å fly til.</li>
      </ul>
    </div>
  );
}
