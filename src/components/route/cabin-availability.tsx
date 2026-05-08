"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CabinPoint } from "@/lib/route";
import type {
  CabinAvailabilityInfo,
  CabinAvailabilityStatus,
} from "@/lib/ut/availability";

interface Props {
  cabins: CabinPoint[];
  persons: number;
  startDate: string | null;
  endDate: string | null;
}

interface AvailabilityResult extends CabinAvailabilityInfo {
  alternatives: CabinAvailabilityInfo[];
}

const STATUS_STYLE: Record<
  CabinAvailabilityStatus,
  { label: string; cls: string }
> = {
  ledig: { label: "Ledig", cls: "bg-forest text-white" },
  fullt: { label: "Fullt", cls: "bg-flame-hover text-white" },
  ukjent: { label: "Ukjent", cls: "bg-midnight-sun text-text-primary" },
};

export function CabinAvailability({
  cabins,
  persons,
  startDate,
  endDate,
}: Props) {
  const [results, setResults] = useState<AvailabilityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cabinsWithUtId = useMemo(
    () => cabins.filter((c) => typeof c.utId === "number"),
    [cabins],
  );
  const utIdsKey = useMemo(
    () => cabinsWithUtId.map((c) => c.utId).join(","),
    [cabinsWithUtId],
  );

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    if (cabinsWithUtId.length === 0) {
      Promise.resolve().then(() => {
        if (!ctrl.signal.aborted) {
          setResults([]);
          setError(null);
          setLoading(false);
        }
      });
      return () => ctrl.abort();
    }

    Promise.resolve()
      .then(() => {
        if (ctrl.signal.aborted) return;
        setLoading(true);
        setError(null);
      })
      .then(() =>
        fetch("/api/cabins/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cabins: cabinsWithUtId.map((c) => ({
              utId: c.utId,
              lat: c.lat,
              lon: c.lon,
            })),
            persons,
          }),
          signal: ctrl.signal,
        }),
      )
      .then(async (res) => {
        if (!res) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Feil ${res.status}`);
        }
        const data = (await res.json()) as { results: AvailabilityResult[] };
        if (!ctrl.signal.aborted) setResults(data.results);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Kunne ikke sjekke tilgjengelighet",
        );
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [utIdsKey, persons, cabinsWithUtId]);

  if (cabins.length === 0) {
    return (
      <p
        className="text-text-primary text-lg leading-snug"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        Legg til hytter under {`«Hytter og etapper»`} for å sjekke
        tilgjengelighet.
      </p>
    );
  }

  if (cabinsWithUtId.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Hyttene mangler ID fra UT.no, så vi får ikke sjekket bookingstatus
        automatisk. Søk dem opp på nytt for å koble dem til.
      </p>
    );
  }

  const dateNote =
    startDate && endDate
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : startDate
        ? `Fra ${formatDate(startDate)}`
        : "Datoer ikke satt";

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-sm text-xs uppercase tracking-label text-text-muted">
        <span style={{ fontFamily: "var(--font-stamp)" }}>{dateNote}</span>
        <span style={{ fontFamily: "var(--font-stamp)" }}>
          {persons} {persons === 1 ? "person" : "personer"}
        </span>
      </div>

      {error && (
        <p className="rounded-md border-2 border-warning-border bg-warning-bg p-sm text-sm text-warning">
          {error}
        </p>
      )}

      {loading && results.length === 0 && (
        <p className="text-sm text-text-muted animate-pulse">
          Sjekker hyttestatus mot UT.no...
        </p>
      )}

      <ul className="grid gap-sm">
        {results.map((r) => (
          <li
            key={r.utId}
            className="flex flex-col gap-sm rounded-md border-2 border-flame-pressed bg-bg p-md shadow-[2px_2px_0_var(--brand-flame-pressed)]"
          >
            <div className="flex items-center justify-between gap-sm flex-wrap">
              <div className="flex flex-col">
                <span className="font-heading text-h3 font-bold text-text-primary">
                  {r.name}
                </span>
                <span className="text-xs text-text-muted">
                  {r.beds.total > 0
                    ? `${r.beds.total} senger`
                    : "Sengantall ukjent"}
                  {r.serviceLevel ? ` · ${labelService(r.serviceLevel)}` : ""}
                </span>
              </div>
              <span
                className={`text-xs font-bold px-sm py-1 rounded-pill uppercase tracking-label ${STATUS_STYLE[r.status].cls}`}
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                {STATUS_STYLE[r.status].label}
              </span>
            </div>

            <p className="text-sm text-text-primary">{r.reason}</p>

            {r.bookingUrl && (
              <a
                href={r.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-fjord underline underline-offset-4 hover:text-fjord/80 self-start"
              >
                Bestill hos DNT →
              </a>
            )}

            {r.alternatives.length > 0 && (
              <div className="mt-xs rounded-md border-2 border-fjord bg-fjord-tint p-sm">
                <p
                  className="mb-xs text-xs uppercase tracking-label text-fjord font-bold"
                  style={{ fontFamily: "var(--font-stamp)" }}
                >
                  Alternativer i nærheten
                </p>
                <ul className="grid gap-1">
                  {r.alternatives.map((alt) => (
                    <li
                      key={alt.utId}
                      className="flex items-center justify-between gap-sm text-sm"
                    >
                      <span className="text-text-primary">
                        <strong>{alt.name}</strong>{" "}
                        <span className="text-text-muted">
                          ({alt.beds.total > 0 ? `${alt.beds.total} senger` : "ukjent"})
                        </span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-sm py-0.5 rounded-pill uppercase tracking-label ${STATUS_STYLE[alt.status].cls}`}
                        style={{ fontFamily: "var(--font-stamp)" }}
                      >
                        {STATUS_STYLE[alt.status].label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
  });
}

function labelService(level: string): string {
  switch (level) {
    case "STAFFED":
      return "Betjent";
    case "SELF_SERVICE":
      return "Selvbetjent";
    case "NO_SERVICE":
      return "Ubetjent";
    case "EMERGENCY_SHELTER":
      return "Nødbu";
    case "RENTAL":
      return "Utleie";
    default:
      return level.toLowerCase();
  }
}
