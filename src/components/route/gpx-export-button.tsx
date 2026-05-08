"use client";

import { useState } from "react";

interface GpxExportButtonProps {
  tripIdOrToken: string;
  disabled?: boolean;
  cabinCount: number;
}

export function GpxExportButton({
  tripIdOrToken,
  disabled,
  cabinCount,
}: GpxExportButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooFew = cabinCount < 2;
  const isDisabled = disabled || busy || tooFew;

  async function onExport() {
    if (isDisabled) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/trips/${tripIdOrToken}/gpx`, {
        method: "GET",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Kunne ikke hente GPX (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "tur.gpx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex flex-wrap items-center gap-sm">
        <button
          type="button"
          onClick={onExport}
          disabled={isDisabled}
          className="inline-flex items-center gap-xs rounded-md border-2 border-flame-pressed bg-flame-primary px-md py-sm text-sm font-bold text-white shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_var(--brand-flame-pressed)]"
        >
          <span aria-hidden>⌚</span>
          {busy ? "Lager GPX..." : "Eksporter GPX"}
        </button>
        <span className="text-xs text-text-muted">
          Last ned ruta som GPX-fil. Importer i Garmin Connect, Suunto, komoot eller annen GPS-enhet.
        </span>
      </div>
      {tooFew && !error && (
        <p className="text-xs text-text-muted">
          Legg til minst to hytter før du kan eksportere.
        </p>
      )}
      {error && (
        <p className="text-xs text-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
