"use client";

import { useState } from "react";
import { ElevationProfile } from "./elevation-profile";
import type { ProfilePoint, TripStats } from "@/lib/trips/stats";

export interface CompareTripOption {
  id: string;
  title: string;
  area: string;
  startDate: string | null;
  stats: TripStats;
  profile: ProfilePoint[];
}

interface Props {
  trips: CompareTripOption[];
}

function formatYear(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("nb-NO", {
    month: "short",
    year: "numeric",
  });
}

export function CompareTripsPicker({ trips }: Props) {
  const [leftId, setLeftId] = useState<string>(trips[0]?.id ?? "");
  const [rightId, setRightId] = useState<string>(
    trips[1]?.id ?? trips[0]?.id ?? "",
  );

  if (trips.length < 2) {
    return null;
  }

  const left = trips.find((t) => t.id === leftId) ?? trips[0];
  const right = trips.find((t) => t.id === rightId) ?? trips[1] ?? trips[0];
  const sharedKm = Math.max(left.stats.distanceKm, right.stats.distanceKm);
  const sharedElev = Math.max(left.stats.elevationGain, right.stats.elevationGain);

  return (
    <section className="mb-xl">
      <h2 className="font-heading text-h2 font-bold text-forest mb-md">
        Sammenlign to turer
      </h2>
      <p
        className="text-text-primary text-lg mb-md leading-snug"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        Side om side. Samme skala. Sannheten er en høydegraf.
      </p>
      <div className="grid sm:grid-cols-2 gap-md">
        <CompareColumn
          trip={left}
          options={trips}
          selected={leftId}
          onChange={setLeftId}
          maxKm={sharedKm}
          maxElev={sharedElev}
          accent="primary"
        />
        <CompareColumn
          trip={right}
          options={trips}
          selected={rightId}
          onChange={setRightId}
          maxKm={sharedKm}
          maxElev={sharedElev}
          accent="fjord"
        />
      </div>
    </section>
  );
}

function CompareColumn({
  trip,
  options,
  selected,
  onChange,
  maxKm,
  maxElev,
  accent,
}: {
  trip: CompareTripOption;
  options: CompareTripOption[];
  selected: string;
  onChange: (id: string) => void;
  maxKm: number;
  maxElev: number;
  accent: "primary" | "fjord";
}) {
  const borderClass =
    accent === "primary"
      ? "border-flame-pressed shadow-[4px_4px_0_var(--brand-flame-pressed)]"
      : "border-fjord shadow-[4px_4px_0_var(--accent-fjord)]";
  return (
    <div className={`bg-bg border-4 rounded-lg p-md ${borderClass}`}>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg border-2 border-flame-pressed rounded-sm px-sm py-1 text-sm font-bold mb-md"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title} ({formatYear(o.startDate)})
          </option>
        ))}
      </select>
      <p className="text-sm text-text-muted mb-sm">
        {trip.stats.distanceKm.toFixed(1)} km ·{" "}
        {trip.stats.elevationGain} hm · {trip.stats.legCount} etapper
        {trip.stats.durationDays ? ` · ${trip.stats.durationDays} dager` : ""}
      </p>
      <ElevationProfile
        points={trip.profile}
        maxKm={maxKm || undefined}
        maxElevation={maxElev || undefined}
        highlight={accent === "primary"}
      />
    </div>
  );
}
