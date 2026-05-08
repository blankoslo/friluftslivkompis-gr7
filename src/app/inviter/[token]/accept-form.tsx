"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<"accepted" | "declined" | "pending" | null>(null);

  async function submit(status: "accepted" | "declined" | "pending") {
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
      <p
        className="text-2xl text-flame-pressed"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 700 }}
      >
        Takk, {name.trim()}! Du er meldt på. Vi sees i fjellet.
      </p>
    );
  }
  if (success === "declined") {
    return (
      <p
        className="text-2xl text-text-muted"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 700 }}
      >
        Synd å høre, {name.trim()}. Kanskje neste tur.
      </p>
    );
  }
  if (success === "pending") {
    return (
      <p
        className="text-2xl text-midnight-sun"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 700 }}
      >
        Greit, {name.trim()}! Vi noterer at du er usikker — meld deg på når du vet mer.
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
        <span
          className="text-small text-text-muted tracking-label uppercase font-bold"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          Navnet ditt
        </span>
        <input
          id="name"
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

      <div className="flex flex-col sm:flex-row gap-sm">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="inline-flex h-11 items-center justify-center rounded-md bg-flame-primary px-lg text-body font-bold text-white transition-colors hover:bg-flame-hover active:bg-flame-pressed disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)]"
        >
          {submitting ? "Sender..." : "Jeg er med!"}
        </button>
        <button
          type="button"
          onClick={() => submit("pending")}
          disabled={submitting || !name.trim()}
          className="inline-flex h-11 items-center justify-center rounded-pill border-2 border-midnight-sun bg-bg px-lg text-body font-bold text-midnight-sun shadow-[2px_2px_0_var(--accent-midnight-sun)] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--accent-midnight-sun)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Vet ikke ennå
        </button>
        <button
          type="button"
          onClick={() => submit("declined")}
          disabled={submitting || !name.trim()}
          className="inline-flex h-11 items-center justify-center rounded-pill border-2 border-flame-pressed bg-bg px-lg text-body font-bold text-flame-pressed shadow-[2px_2px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--brand-flame-pressed)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Kan ikke
        </button>
      </div>
    </form>
  );
}
