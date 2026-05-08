"use client";

import { useCallback, useState } from "react";
import { AiDisclosure, SourceBadge } from "@/components/ui/ai-disclosure";
import { StaleBadge } from "@/components/ui/stale-badge";
import { cn } from "@/lib/utils";
import type {
  CompareCabinFacts,
  CompareMissingField,
  CompareResult,
} from "@/lib/claude/cabin-compare";

interface Props {
  tripId: string;
  cabinCount: number;
}

interface ApiResponse {
  result?: CompareResult;
  facts?: CompareCabinFacts[];
  stale?: boolean;
  error?: string;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      result: CompareResult;
      facts: CompareCabinFacts[];
      stale: boolean;
    };

const FIELD_LABEL: Record<CompareMissingField, string> = {
  pris: "Pris",
  kapasitet: "Kapasitet",
  beliggenhet: "Beliggenhet",
  betjening: "Betjeningsnivå",
};

export function CabinComparePanel({ tripId, cabinCount }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });

  const run = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/trips/${tripId}/cabins/compare`, {
        method: "POST",
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.result || !data.facts) {
        setState({
          status: "error",
          message: data.error ?? `Kunne ikke hente sammenligning (${res.status}).`,
        });
        return;
      }
      setState({
        status: "ready",
        result: data.result,
        facts: data.facts,
        stale: data.stale === true,
      });
    } catch (err) {
      setState({
        status: "error",
        message: (err as Error).message ?? "Nettverksfeil.",
      });
    }
  }, [tripId]);

  if (cabinCount < 2) {
    return (
      <p className="text-sm text-text-muted">
        Legg til minst to hytter for å se en sammenligning.
      </p>
    );
  }

  return (
    <div className="space-y-md">
      {state.status === "idle" && (
        <div className="flex flex-wrap items-center gap-md">
          <button
            type="button"
            onClick={run}
            className="inline-flex items-center gap-xs rounded-md bg-flame-primary px-md py-sm text-sm font-bold text-white hover:bg-flame-hover active:bg-flame-pressed shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-transform"
          >
            ✨ Sammenlign hytter
          </button>
          <span className="text-xs text-text-muted">
            Lars og Claude leser hytteinfo og gir en kort oppsummering.
          </span>
        </div>
      )}

      {state.status === "loading" && (
        <p className="text-sm text-text-muted">
          Henter hyttedata og lar AI-en koke det ned...
        </p>
      )}

      {state.status === "error" && (
        <div className="space-y-sm">
          <p className="text-sm text-flame-pressed">{state.message}</p>
          <button
            type="button"
            onClick={run}
            className="rounded-md border-2 border-flame-pressed bg-bg px-md py-sm text-sm font-bold text-flame-pressed hover:bg-midnight-sun-tint"
          >
            Prøv igjen
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <CompareView
          result={state.result}
          facts={state.facts}
          stale={state.stale}
          onRefresh={run}
        />
      )}
    </div>
  );
}

function CompareView({
  result,
  facts,
  stale,
  onRefresh,
}: {
  result: CompareResult;
  facts: CompareCabinFacts[];
  stale: boolean;
  onRefresh: () => void;
}) {
  const factById = new Map(facts.map((f) => [f.utId, f]));
  const winnerId = result.recommendation.utId;
  const winner = result.summaries.find((s) => s.utId === winnerId) ?? null;

  return (
    <div className="space-y-md">
      <div className="flex flex-wrap items-center gap-sm">
        <SourceBadge tone="ai" label="AI-generert" />
        {stale && <StaleBadge snapshotAt={null} />}
        <button
          type="button"
          onClick={onRefresh}
          className="ml-auto rounded-md border border-flame-pressed/40 bg-bg px-sm py-1 text-xs font-bold text-flame-pressed hover:bg-midnight-sun-tint"
        >
          Oppdater
        </button>
      </div>

      <AiDisclosure>
        {result.intro}{" "}
        <span className="text-text-muted">
          Tekst er AI-skrevet, basert på data fra UT.no/DNT.
        </span>
      </AiDisclosure>

      {winner && (
        <div className="rounded-lg border-2 border-forest bg-forest-tint px-md py-sm">
          <div className="mb-xs flex items-center gap-sm">
            <span className="rounded-pill bg-forest px-sm py-[2px] text-[10px] font-bold uppercase tracking-label text-white">
              Lars sin favoritt
            </span>
            <span className="font-heading text-base font-bold text-text-primary">
              {winner.name}
            </span>
          </div>
          <p className="text-sm text-text-primary">
            {result.recommendation.reason}
          </p>
        </div>
      )}

      <div className="grid gap-md sm:grid-cols-2">
        {result.summaries.map((s) => {
          const fact = factById.get(s.utId);
          const isWinner = s.utId === winnerId;
          return (
            <article
              key={s.utId}
              className={cn(
                "rounded-lg border-2 bg-bg p-md text-sm shadow-[3px_3px_0_var(--brand-flame-pressed)]",
                isWinner ? "border-forest" : "border-flame-pressed/60",
              )}
            >
              <header className="mb-sm flex items-start justify-between gap-sm">
                <h3 className="font-heading text-base font-bold text-text-primary">
                  {s.name}
                </h3>
                {fact && (
                  <span className="text-[10px] uppercase tracking-label text-text-muted">
                    {fact.serviceLevelLabel}
                  </span>
                )}
              </header>

              <p className="mb-sm text-sm text-text-primary">{s.oneLiner}</p>

              {fact && <FactGrid fact={fact} />}

              <dl className="mt-sm space-y-xs text-xs">
                <Row label="Kapasitet" value={s.capacityNote} />
                <Row label="Beliggenhet" value={s.locationNote} />
                <Row label="Skiller seg ved" value={s.distinctive} />
              </dl>

              {s.missingFields.length > 0 && (
                <MissingFields fields={s.missingFields} />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-x-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-text-primary">{value}</dd>
    </div>
  );
}

function FactGrid({ fact }: { fact: CompareCabinFacts }) {
  const beds =
    fact.totalBeds === null || fact.totalBeds === 0 ? null : fact.totalBeds;
  const distance =
    fact.distanceFromPrevKm !== null
      ? `${fact.distanceFromPrevKm.toFixed(1)} km fra forrige`
      : fact.distanceToNextKm !== null
        ? `${fact.distanceToNextKm.toFixed(1)} km til neste`
        : null;
  return (
    <div className="flex flex-wrap gap-xs text-xs">
      <Pill>{beds !== null ? `${beds} senger` : "Sengedata mangler"}</Pill>
      {distance && <Pill>{distance}</Pill>}
      {fact.availabilityStatus && (
        <Pill tone={fact.availabilityStatus}>
          {fact.availabilityStatus === "ledig"
            ? "Ledig"
            : fact.availabilityStatus === "fullt"
              ? "Fullt"
              : "Ukjent ledighet"}
        </Pill>
      )}
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "ledig" | "fullt" | "ukjent";
}) {
  const cls =
    tone === "ledig"
      ? "bg-forest-tint text-forest border-forest/40"
      : tone === "fullt"
        ? "bg-flame-tint text-flame-pressed border-flame-pressed/40"
        : tone === "ukjent"
          ? "bg-midnight-sun-tint text-text-primary border-midnight-sun/40"
          : "bg-bg text-text-primary border-flame-pressed/30";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-sm py-[2px] text-[11px] font-medium",
        cls,
      )}
    >
      {children}
    </span>
  );
}

function MissingFields({ fields }: { fields: CompareMissingField[] }) {
  return (
    <div className="mt-sm rounded-md border border-warning-border bg-warning-bg px-sm py-xs text-xs text-text-primary">
      <span className="font-bold">Mangler data:</span>{" "}
      {fields.map((f) => FIELD_LABEL[f]).join(", ")}.
    </div>
  );
}
