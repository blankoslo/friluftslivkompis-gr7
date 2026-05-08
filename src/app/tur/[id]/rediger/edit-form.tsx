"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EditTripFormProps {
  tripId: string;
  initial: {
    title: string;
    area: string;
    startDate: string;
    endDate: string;
  };
}

export function EditTripForm({ tripId, initial }: EditTripFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [area, setArea] = useState(initial.area);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = { title, area };
      if (startDate) payload.startDate = startDate;
      else payload.startDate = null;
      if (endDate) payload.endDate = endDate;
      else payload.endDate = null;

      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Kunne ikke lagre endringer");
      }
      router.push(`/tur/${tripId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-bg border-4 border-flame-pressed rounded-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] p-lg space-y-md"
    >
      <Field label="Turnavn" htmlFor="title">
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="F.eks. Rondane rundt"
          className="w-full rounded-md border-2 border-flame-pressed bg-bg px-md py-sm text-body text-text-primary font-semibold placeholder:text-flame-primary/50 focus:outline-none focus:ring-2 focus:ring-flame-primary"
        />
      </Field>

      <Field label="Område" htmlFor="area">
        <input
          id="area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Rondane, Jotunheimen, Hardangervidda..."
          className="w-full rounded-md border-2 border-flame-pressed bg-bg px-md py-sm text-body text-text-primary font-semibold placeholder:text-flame-primary/50 focus:outline-none focus:ring-2 focus:ring-flame-primary"
        />
      </Field>

      <div className="grid grid-cols-2 gap-md">
        <Field label="Fra" htmlFor="startDate">
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border-2 border-flame-pressed bg-bg px-md py-sm text-body text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-flame-primary"
          />
        </Field>
        <Field label="Til" htmlFor="endDate">
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border-2 border-flame-pressed bg-bg px-md py-sm text-body text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-flame-primary"
          />
        </Field>
      </div>

      {error && (
        <p className="text-small text-warning bg-warning-bg border-2 border-warning-border rounded-md px-md py-sm font-semibold">
          {error}
        </p>
      )}

      <div className="flex gap-sm">
        <button
          type="submit"
          disabled={submitting || !title}
          className="inline-flex h-11 items-center justify-center rounded-md bg-flame-primary px-lg text-body font-bold text-white shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:bg-flame-hover hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Lagrer..." : "Lagre endringer"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-11 items-center justify-center rounded-md border-2 border-flame-pressed bg-bg px-lg text-body font-bold text-flame-pressed hover:bg-flame-pressed hover:text-white transition-colors"
        >
          Avbryt
        </button>
      </div>
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
      <span
        className="text-small text-flame-pressed tracking-label uppercase font-bold"
        style={{ fontFamily: "var(--font-stamp)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
