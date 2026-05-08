"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<"accepted" | "declined" | null>(null);

  async function submit(status: "accepted" | "declined") {
    if (submitting) return;
    if (!name.trim()) {
      setError("Skriv inn navnet ditt først");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${token}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Kunne ikke registrere svar");
      }
      setSuccess(status);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
    } finally {
      setSubmitting(false);
    }
  }

  if (success === "accepted") {
    return (
      <p className="text-text-primary">
        Takk, {name.trim()}! Du er meldt på. Vi sees i fjellet.
      </p>
    );
  }
  if (success === "declined") {
    return (
      <p className="text-text-muted">
        Synd å høre, {name.trim()}. Kanskje neste tur.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit("accepted");
      }}
      className="space-y-md"
    >
      <label htmlFor="name" className="block space-y-xs">
        <span className="text-small text-text-muted tracking-label uppercase">
          Navnet ditt
        </span>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ola Nordmann"
          className="w-full rounded-md border border-border bg-bg px-md py-sm text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-flame-primary"
        />
      </label>

      {error && (
        <p className="text-small text-warning bg-warning-bg border border-warning-border rounded-md px-md py-sm">
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-sm">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="inline-flex h-11 items-center justify-center rounded-md bg-flame-primary px-lg text-body font-medium text-white transition-colors hover:bg-flame-hover active:bg-flame-pressed disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Sender..." : "Bli med"}
        </button>
        <button
          type="button"
          onClick={() => submit("declined")}
          disabled={submitting || !name.trim()}
          className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-bg px-lg text-body font-medium text-text-muted transition-colors hover:border-warning-border hover:text-warning disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Kan ikke
        </button>
      </div>
    </form>
  );
}
