"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DayAcceptForm({
  token,
  dayNumber,
  legLabel,
}: {
  token: string;
  dayNumber: number;
  legLabel: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (submitting || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${token}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          status: "accepted",
          days: [dayNumber],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Kunne ikke registrere svar");
      }
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <p
        className="text-2xl text-flame-pressed"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 700 }}
      >
        Supert, {name.trim()}! Du er med på {legLabel}.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-md"
    >
      <label htmlFor="dag-name" className="block space-y-xs">
        <span
          className="text-small text-text-muted tracking-label uppercase font-bold"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          Navnet ditt
        </span>
        <input
          id="dag-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ola Nordmann"
          className="w-full rounded-md border-2 border-flame-pressed bg-bg px-md py-sm text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-flame-primary shadow-[4px_4px_0_var(--brand-flame-pressed)]"
        />
      </label>

      {error && (
        <p className="text-small text-warning bg-warning-bg border-2 border-warning-border rounded-md px-md py-sm font-semibold">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="inline-flex h-11 items-center justify-center rounded-md bg-flame-primary px-lg text-body font-bold text-white transition-colors hover:bg-flame-hover active:bg-flame-pressed disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)]"
      >
        {submitting ? "Sender..." : `Jeg er med på dag ${dayNumber}!`}
      </button>
    </form>
  );
}
