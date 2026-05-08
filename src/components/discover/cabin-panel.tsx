"use client";

import { useEffect, useState } from "react";
import {
  cabinAccessibility,
  serviceLevelLabel,
  totalBeds,
  type Cabin,
} from "@/lib/ut";
import { cn } from "@/lib/utils";
import { randomQuip } from "@/lib/lars-monsen/quips";
import { StaleBadge } from "@/components/ui/stale-badge";

type Props = {
  cabinId: number;
  onClose: () => void;
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; cabin: Cabin; stale: boolean; snapshotAt: string | null };

type ApiResponse = {
  cabin?: Cabin;
  error?: string;
  stale?: boolean;
  snapshotAt?: string | null;
};

export function CabinPanel({ cabinId, onClose }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [quip] = useState(() => randomQuip("cabinSelect"));

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/cabins/${cabinId}`, { signal: controller.signal })
      .then(async (res) => {
        const data = (await res.json()) as ApiResponse;
        if (!res.ok || !data.cabin) {
          throw new Error(data.error ?? `Hytte ${cabinId} kunne ikke hentes`);
        }
        setState({
          status: "ready",
          cabin: data.cabin,
          stale: data.stale === true,
          snapshotAt: data.snapshotAt ?? null,
        });
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setState({ status: "error", message: (err as Error).message });
      });

    return () => controller.abort();
  }, [cabinId]);

  return (
    <aside className="rounded-lg border bg-card p-4 text-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            DNT-hytte
          </div>
          <h2 className="text-base font-semibold leading-tight">
            {state.status === "ready" ? state.cabin.name : "Hytteinfo"}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Lukk"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ×
        </button>
      </div>

      {state.status === "loading" && (
        <p className="text-muted-foreground">Henter hyttedetaljer…</p>
      )}

      {state.status === "error" && (
        <p className="text-destructive">{state.message}</p>
      )}

      {state.status === "ready" && (
        <>
          {state.stale && (
            <div className="mb-3">
              <StaleBadge snapshotAt={state.snapshotAt} />
              <p className="mt-1.5 text-xs text-text-muted leading-relaxed">
                DNT-tjenesten er nede. Viser forhåndslastet snapshot - tall og
                åpningstider kan ha endret seg.
              </p>
            </div>
          )}
          <CabinBody cabin={state.cabin} />
        </>
      )}

      {state.status === "ready" && (
        <p
          className="mt-md border-t-2 border-flame-pressed/20 pt-sm text-base text-text-primary leading-snug"
          style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
        >
          - Lars: {quip}
        </p>
      )}
    </aside>
  );
}

function CabinBody({ cabin }: { cabin: Cabin }) {
  const access = cabinAccessibility(cabin);
  const beds = totalBeds(cabin);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Badge>{serviceLevelLabel(cabin.serviceLevel)}</Badge>
        <Badge tone={access.status === "closed" ? "warn" : "ok"}>
          {access.label}
        </Badge>
      </div>

      {beds > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Sengeplasser</dt>
          <dd className="font-medium">{beds}</dd>
          {cabin.bedsStaffed ? (
            <>
              <dt className="text-muted-foreground">Betjent</dt>
              <dd>{cabin.bedsStaffed}</dd>
            </>
          ) : null}
          {cabin.bedsSelfService ? (
            <>
              <dt className="text-muted-foreground">Selvbetjent</dt>
              <dd>{cabin.bedsSelfService}</dd>
            </>
          ) : null}
          {cabin.bedsNoService ? (
            <>
              <dt className="text-muted-foreground">Ubetjent</dt>
              <dd>{cabin.bedsNoService}</dd>
            </>
          ) : null}
          {cabin.bedsWinter ? (
            <>
              <dt className="text-muted-foreground">Vinterrom</dt>
              <dd>{cabin.bedsWinter}</dd>
            </>
          ) : null}
          {cabin.bedsExtra ? (
            <>
              <dt className="text-muted-foreground">Ekstra</dt>
              <dd>{cabin.bedsExtra}</dd>
            </>
          ) : null}
        </dl>
      )}

      {cabin.description && (
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-6">
          {cabin.description}
        </p>
      )}

      {(cabin.phone || cabin.email) && (
        <div className="space-y-0.5 text-xs">
          {cabin.phone && (
            <div>
              <span className="text-muted-foreground">Tlf: </span>
              <a
                href={`tel:${cabin.phone}`}
                className="text-primary hover:underline"
              >
                {cabin.phone}
              </a>
            </div>
          )}
          {cabin.email && (
            <div>
              <span className="text-muted-foreground">E-post: </span>
              <a
                href={`mailto:${cabin.email}`}
                className="text-primary hover:underline"
              >
                {cabin.email}
              </a>
            </div>
          )}
        </div>
      )}

      <a
        href={`https://ut.no/hytte/${cabin.id}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
      >
        Åpne på UT.no →
      </a>
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn";
}) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        tone === "ok" &&
          "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
        tone === "warn" &&
          "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
        tone === "neutral" && "bg-muted text-foreground",
      )}
    >
      {children}
    </span>
  );
}
