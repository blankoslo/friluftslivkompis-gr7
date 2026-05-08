"use client";

import { useState } from "react";
import type { ReviewGroupSize, ReviewSeason } from "@/models/Review";

type Props = {
  utTripId?: number;
  tripId?: string;
  targetTitle: string;
  targetArea?: string;
  onPosted?: () => void;
};

const SEASONS: { value: ReviewSeason; label: string }[] = [
  { value: "vinter", label: "Vinter" },
  { value: "vår", label: "Vår" },
  { value: "sommer", label: "Sommer" },
  { value: "høst", label: "Høst" },
];

const GROUPS: { value: ReviewGroupSize; label: string }[] = [
  { value: "alene", label: "Alene" },
  { value: "par", label: "Par" },
  { value: "familie", label: "Familie" },
  { value: "venner", label: "Venner" },
  { value: "stor-gjeng", label: "Stor gjeng" },
];

const SUGGESTED_TAGS = [
  "familievennlig",
  "krevende",
  "fin utsikt",
  "rolig",
  "barnevennlig",
  "tørr",
  "våt",
  "godt merket",
  "dårlig merket",
];

export function ReviewForm({
  utTripId,
  tripId,
  targetTitle,
  targetArea,
  onPosted,
}: Props) {
  const [rating, setRating] = useState<number>(0);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [season, setSeason] = useState<ReviewSeason | "">("");
  const [groupSize, setGroupSize] = useState<ReviewGroupSize | "">("");
  const [authorName, setAuthorName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Velg stjerner");
      return;
    }
    if (text.trim().length < 4) {
      setError("Skriv noen ord");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utTripId,
          tripId,
          targetTitle,
          targetArea,
          rating,
          text: text.trim(),
          tags,
          season: season || undefined,
          groupSize: groupSize || undefined,
          authorName: authorName.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Kunne ikke lagre");
      }
      setDone(true);
      setText("");
      setTags([]);
      setRating(0);
      onPosted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feilet");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-forest font-bold">
        Takk for anmeldelsen! Andre turfolk får nytte av den.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sm">
      <div className="flex items-center gap-xs">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? "text-midnight-sun" : "text-text-muted"}`}
            aria-label={`${n} stjerner`}
          >
            ★
          </button>
        ))}
        <span className="text-xs text-text-muted ml-xs">
          {rating > 0 ? `${rating}/5` : "Velg vurdering"}
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Hvordan var turen? Vær, terreng, hytter, tips til andre..."
        rows={4}
        maxLength={2000}
        className="rounded border-2 border-flame-pressed/40 bg-bg px-sm py-xs text-sm"
      />

      <div className="flex flex-wrap gap-xs">
        {SUGGESTED_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggleTag(t)}
            className={`rounded-pill border-2 px-sm py-1 text-xs font-bold transition-colors ${tags.includes(t) ? "border-forest bg-forest text-white" : "border-flame-pressed/40 bg-bg text-text-primary"}`}
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            {tags.includes(t) ? "✓ " : ""}
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-sm">
        <label className="flex flex-col text-xs font-bold uppercase tracking-label">
          Sesong
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value as ReviewSeason | "")}
            className="mt-xs rounded border border-flame-pressed/40 bg-bg px-sm py-xs text-sm font-normal normal-case"
          >
            <option value="">-</option>
            {SEASONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-bold uppercase tracking-label">
          Gruppe
          <select
            value={groupSize}
            onChange={(e) =>
              setGroupSize(e.target.value as ReviewGroupSize | "")
            }
            className="mt-xs rounded border border-flame-pressed/40 bg-bg px-sm py-xs text-sm font-normal normal-case"
          >
            <option value="">-</option>
            {GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Navn (valgfritt)"
        className="rounded border border-flame-pressed/40 bg-bg px-sm py-xs text-sm"
        maxLength={60}
      />

      {error && <p className="text-xs text-flame-pressed font-bold">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="self-start rounded-pill border-2 border-flame-pressed bg-flame-primary px-md py-sm text-sm font-bold text-white shadow-[3px_3px_0_var(--brand-flame-pressed)] transition-transform hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] disabled:opacity-50"
        style={{ fontFamily: "var(--font-stamp)", letterSpacing: "0.04em" }}
      >
        {busy ? "Sender..." : "Publiser anmeldelse"}
      </button>
    </form>
  );
}
