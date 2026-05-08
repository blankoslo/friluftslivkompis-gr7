"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NyTurForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = { title, area, phase: "gather" };
      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;
      if (organizer.trim()) {
        payload.participants = [
          { name: organizer.trim(), status: "accepted" },
        ];
      }

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Kunne ikke opprette tur");
      }
      const trip = await res.json();
      router.push(`/tur/${trip._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-border bg-surface p-lg space-y-md"
    >
      <Field label="Turnavn" htmlFor="title">
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="F.eks. Rondane rundt"
          className="w-full rounded-md border border-border bg-bg px-md py-sm text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-flame-primary"
        />
      </Field>

      <Field label="Område" htmlFor="area">
        <input
          id="area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Rondane, Jotunheimen, Hardangervidda..."
          className="w-full rounded-md border border-border bg-bg px-md py-sm text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-flame-primary"
        />
      </Field>

      <div className="grid grid-cols-2 gap-md">
        <Field label="Fra" htmlFor="startDate">
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-md py-sm text-body text-text-primary focus:outline-none focus:border-flame-primary"
          />
        </Field>
        <Field label="Til" htmlFor="endDate">
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-md py-sm text-body text-text-primary focus:outline-none focus:border-flame-primary"
          />
        </Field>
      </div>

      <Field label="Ditt navn" htmlFor="organizer">
        <input
          id="organizer"
          value={organizer}
          onChange={(e) => setOrganizer(e.target.value)}
          placeholder="Vises som turplanlegger"
          className="w-full rounded-md border border-border bg-bg px-md py-sm text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-flame-primary"
        />
      </Field>

      {error && (
        <p className="text-small text-warning bg-warning-bg border border-warning-border rounded-md px-md py-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !title}
        className="inline-flex h-11 items-center justify-center rounded-md bg-flame-primary px-lg text-body font-medium text-white transition-colors hover:bg-flame-hover active:bg-flame-pressed disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Oppretter..." : "Opprett tur"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-xs">
      <span className="text-small text-text-muted tracking-label uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
