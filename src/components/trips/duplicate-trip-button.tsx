"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  tripId: string;
  defaultTitle?: string;
  defaultStart?: string;
  defaultEnd?: string;
  variant?: "compact" | "panel";
  label?: string;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function suggestNextYearStart(prevIso?: string): string {
  if (prevIso) {
    const d = new Date(prevIso);
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    return isoDate(d);
  }
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 30);
  return isoDate(d);
}

function suggestEnd(start: string, prevStart?: string, prevEnd?: string): string {
  if (prevStart && prevEnd) {
    const days = Math.max(
      0,
      Math.round(
        (new Date(prevEnd).getTime() - new Date(prevStart).getTime()) / 86400000,
      ),
    );
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + days);
    return isoDate(d);
  }
  return start;
}

export function DuplicateTripButton({
  tripId,
  defaultTitle,
  defaultStart,
  defaultEnd,
  variant = "compact",
  label = "Gjenta",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initialStart = suggestNextYearStart(defaultStart);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(
    suggestEnd(initialStart, defaultStart, defaultEnd),
  );
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          title: title.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { id?: string };
      if (!data.id) throw new Error("Mangler trip-id");
      router.push(`/tur/${data.id}`);
      router.refresh();
    } catch {
      setError("Klarte ikke gjenta turen. Prøv igjen.");
      setBusy(false);
    }
  }

  if (!open) {
    if (variant === "compact") {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          className="text-xs font-bold text-flame-pressed hover:text-flame-primary transition-colors px-xs py-1"
        >
          {label} ↻
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-xs rounded-md border-2 border-flame-pressed bg-bg px-md py-sm text-sm font-bold text-flame-pressed shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-transform"
      >
        <span>↻</span>
        {label}
      </button>
    );
  }

  const wrapperClass =
    variant === "compact"
      ? "absolute right-0 top-full mt-xs z-20 w-[min(20rem,90vw)] bg-bg border-2 border-flame-pressed rounded-md p-md shadow-[4px_4px_0_var(--brand-flame-pressed)]"
      : "bg-bg border-2 border-flame-pressed rounded-md p-md shadow-[3px_3px_0_var(--brand-flame-pressed)]";

  return (
    <div
      className={variant === "compact" ? "relative" : ""}
      onClick={(e) => e.preventDefault()}
    >
      {variant === "compact" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-bold text-flame-primary px-xs py-1"
        >
          {label} ↻
        </button>
      )}
      <form onSubmit={submit} className={wrapperClass}>
        <p
          className="text-xs uppercase tracking-label text-text-muted mb-sm font-bold"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          Gjenta turen
        </p>
        <div className="grid gap-sm">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-text-primary">Tittel</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle ?? "Ny tur"}
              className="bg-bg border-2 border-flame-pressed rounded-sm px-sm py-1 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-sm">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-text-primary">Start</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setEndDate(
                    suggestEnd(e.target.value, defaultStart, defaultEnd),
                  );
                }}
                className="bg-bg border-2 border-flame-pressed rounded-sm px-sm py-1 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-text-primary">Slutt</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-bg border-2 border-flame-pressed rounded-sm px-sm py-1 text-sm"
              />
            </label>
          </div>
        </div>
        <p
          className="text-xs text-text-muted mt-sm leading-snug"
          style={{ fontFamily: "var(--font-handwriting)" }}
        >
          Hytter, etapper, pakkeliste og deltakere blir med. Utgifter starter på
          null.
        </p>
        {error && (
          <p className="text-xs text-flame-primary font-bold mt-xs">{error}</p>
        )}
        <div className="flex gap-sm justify-end mt-md">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={busy}
            className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors px-sm py-1"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={busy}
            className="text-xs font-bold text-white bg-flame-primary px-md py-sm rounded hover:bg-flame-hover transition-colors disabled:opacity-50"
          >
            {busy ? "Lager…" : "Lag ny tur"}
          </button>
        </div>
      </form>
    </div>
  );
}
