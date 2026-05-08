"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  resultLabel,
  type SearchResponse,
  type SearchResult,
} from "@/lib/search/types";
import { StaleBadge } from "@/components/ui/stale-badge";

const DEBOUNCE_MS = 200;
const MIN_CHARS = 3;

type Props = {
  selected: SearchResult | null;
  onSelect: (r: SearchResult) => void;
};

export function SearchBox({ selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [stale, setStale] = useState(false);
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= MIN_CHARS;

  useEffect(() => {
    if (!hasQuery) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=15`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as SearchResponse;
        if (!res.ok) {
          throw new Error(data.error ?? `Søk feilet (${res.status})`);
        }
        setResults(data.results);
        setStale(data.stale === true);
        setSnapshotAt(data.snapshotAt ?? null);
        setActive(0);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed, hasQuery]);

  const visibleResults = hasQuery ? results : [];
  const visibleLoading = hasQuery && loading;
  const visibleError = hasQuery ? error : null;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSelect(r: SearchResult) {
    onSelect(r);
    setQuery(r.name);
    setOpen(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || visibleResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, visibleResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(visibleResults[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = Boolean(
    open && (visibleLoading || visibleError || visibleResults.length > 0 || hasQuery),
  );

  return (
    <div
      ref={containerRef}
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={showDropdown}
      aria-controls="search-results"
      className="relative"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder="Søk på område, hytte eller fjelltopp"
        className="w-full h-11 rounded-lg border border-border bg-background px-4 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
        autoComplete="off"
        aria-autocomplete="list"
      />

      {selected && !open && (
        <p className="mt-2 text-xs text-muted-foreground">
          Valgt: <span className="font-medium text-foreground">{selected.name}</span>
          {selected.municipality && ` - ${selected.municipality}`}
        </p>
      )}

      {showDropdown && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute z-20 mt-1 max-h-96 w-full overflow-auto rounded-lg border border-border bg-background shadow-lg"
        >
          {!visibleLoading && stale && (
            <li className="border-b border-border bg-warning-bg/40 px-4 py-2">
              <StaleBadge snapshotAt={snapshotAt} />
              <p className="mt-1 text-xs text-text-muted leading-snug">
                DNT-tjenesten svarer ikke. Viser hytter fra forhåndslastet snapshot.
              </p>
            </li>
          )}
          {visibleLoading && (
            <li className="px-4 py-3 text-sm text-muted-foreground">Søker…</li>
          )}
          {!visibleLoading && visibleError && (
            <li className="px-4 py-3 text-sm text-destructive">{visibleError}</li>
          )}
          {!visibleLoading && !visibleError && visibleResults.length === 0 && hasQuery && (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              Ingen treff. Lars Monsen ville sagt: prøv et annet stedsnavn.
            </li>
          )}
          {!visibleLoading &&
            !visibleError &&
            visibleResults.map((r, i) => (
              <li
                key={r.id}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(r);
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm",
                  i === active ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{r.name}</div>
                  {(r.municipality || r.county) && (
                    <div className="truncate text-xs text-muted-foreground">
                      {[r.municipality, r.county].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {r.stale && <StaleBadge snapshotAt={snapshotAt} compact />}
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      badgeClasses(r),
                    )}
                  >
                    {resultLabel(r)}
                  </span>
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function badgeClasses(r: SearchResult): string {
  switch (r.kind) {
    case "cabin":
      return r.dntCabin
        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
        : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100";
    case "trip":
      return "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100";
    case "area":
      return "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100";
    case "poi":
      return "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100";
    default:
      return "bg-muted text-foreground";
  }
}
