"use client";

import { useEffect, useState } from "react";
import { ReviewForm } from "./review-form";

type ReviewView = {
  id: string;
  rating: number;
  text: string;
  tags: string[];
  season?: string;
  groupSize?: string;
  authorName?: string;
  createdAt?: string;
};

type Props = {
  utTripId?: number;
  tripId?: string;
  targetTitle: string;
  targetArea?: string;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-midnight-sun" aria-label={`${rating} av 5`}>
      {"★".repeat(rating)}
      <span className="text-text-muted">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReviewsSection({
  utTripId,
  tripId,
  targetTitle,
  targetArea,
}: Props) {
  const [reviews, setReviews] = useState<ReviewView[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (typeof utTripId === "number") params.set("utTripId", String(utTripId));
    if (tripId) params.set("tripId", tripId);
    fetch(`/api/reviews?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { reviews: [], avg: null }))
      .then((data: { reviews: ReviewView[]; avg: number | null }) => {
        if (cancelled) return;
        setReviews(data.reviews ?? []);
        setAvg(data.avg ?? null);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [utTripId, tripId, reloadCount]);

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-baseline gap-md">
        <p className="font-heading text-h3 text-forest">
          {avg !== null ? `${avg.toFixed(1)} ★` : "Ingen anmeldelser enda"}
        </p>
        {reviews.length > 0 && (
          <p className="text-sm text-text-muted">
            {reviews.length}{" "}
            {reviews.length === 1 ? "anmeldelse" : "anmeldelser"}
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto rounded-pill border-2 border-flame-pressed bg-bg px-md py-xs text-small font-bold text-flame-pressed hover:bg-flame-bg"
          style={{ fontFamily: "var(--font-stamp)", letterSpacing: "0.04em" }}
        >
          {showForm ? "Lukk skjema" : "Skriv anmeldelse"}
        </button>
      </div>

      {showForm && (
        <div className="rounded border-2 border-forest/40 bg-bg p-md">
          <ReviewForm
            utTripId={utTripId}
            tripId={tripId}
            targetTitle={targetTitle}
            targetArea={targetArea}
            onPosted={() => {
              setShowForm(false);
              setReloadCount((c) => c + 1);
            }}
          />
        </div>
      )}

      {loaded && reviews.length === 0 && !showForm && (
        <p
          className="text-text-primary text-lg leading-snug"
          style={{ fontFamily: "var(--font-handwriting)" }}
        >
          Ingen har anmeldt denne enda. Vær først ut.
        </p>
      )}

      <ul className="flex flex-col gap-md">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded border-2 border-flame-pressed/30 bg-bg p-md"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-xs mb-xs">
              <div className="flex items-baseline gap-sm">
                <StarRow rating={r.rating} />
                <span className="text-sm font-bold">
                  {r.authorName || "Anonym turgåer"}
                </span>
              </div>
              <span className="text-xs text-text-muted">
                {formatDate(r.createdAt)}
              </span>
            </div>
            <p className="text-sm text-text-primary whitespace-pre-wrap mb-xs">
              {r.text}
            </p>
            <div className="flex flex-wrap gap-xs text-xs">
              {r.season && (
                <span className="rounded-pill border border-fjord/40 bg-fjord/10 px-sm py-1 font-bold text-fjord">
                  {r.season}
                </span>
              )}
              {r.groupSize && (
                <span className="rounded-pill border border-forest/40 bg-forest/10 px-sm py-1 font-bold text-forest">
                  {r.groupSize}
                </span>
              )}
              {r.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-pill border border-flame-pressed/30 bg-bg px-sm py-1 font-bold text-text-muted"
                >
                  #{t}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
