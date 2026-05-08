import Link from "next/link";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITrip } from "@/models/Trip";
import {
  computeProfilePoints,
  computeTripStats,
  aggregateStats,
  type ProfilePoint,
  type TripStats,
} from "@/lib/trips/stats";
import { ElevationProfile } from "@/components/trips/elevation-profile";
import { CompareTripsPicker } from "@/components/trips/compare-trips-picker";
import { MonsenLine } from "@/components/lars-monsen/monsen-line";

interface PastTripView {
  id: string;
  title: string;
  area: string;
  startDate?: string;
  endDate?: string;
  stats: TripStats;
  profile: ProfilePoint[];
}

async function getPastTrips(): Promise<PastTripView[]> {
  try {
    await connectToDatabase();
    const docs = await Trip.find({})
      .sort({ startDate: -1 })
      .limit(80)
      .lean<ITrip[]>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const out: PastTripView[] = [];
    for (const d of docs) {
      const start = d.startDate ? new Date(d.startDate) : null;
      if (!start || start >= today) continue;
      const stats = computeTripStats(d.legs, d.cabins, d.startDate, d.endDate);
      if (stats.legCount === 0) continue;
      out.push({
        id: String(d._id),
        title: d.title,
        area: d.area ?? "",
        startDate: d.startDate?.toISOString(),
        endDate: d.endDate?.toISOString(),
        stats,
        profile: computeProfilePoints(d.legs, d.cabins),
      });
    }
    return out;
  } catch {
    return [];
  }
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function StatistikkPage() {
  const trips = await getPastTrips();
  const totals = aggregateStats(
    trips.map((t) => ({ ...t.stats, startDate: t.startDate ?? null })),
  );
  const seasons = Object.entries(totals.bySeason).sort(
    (a, b) => b[1].trips - a[1].trips,
  );

  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-md py-xl sm:px-lg sm:py-2xl">
        <header className="mb-xl">
          <p
            className="text-xs uppercase tracking-label font-bold text-flame-pressed mb-xs"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            Tilbake / Return
          </p>
          <h1 className="font-heading text-h1 font-bold mb-xs text-text-primary">
            Statistikk
          </h1>
          <p
            className="text-text-primary text-xl leading-snug mb-md"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            Bevis på at sofaen ikke vant. Igjen.
          </p>
          <MonsenLine category="logTitle" variant="card" />
          <div className="mt-md">
            <Link
              href="/turer"
              className="text-sm font-bold text-flame-pressed hover:text-flame-primary"
            >
              ← Tilbake til turer
            </Link>
          </div>
        </header>

        {trips.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Totals totals={totals} />
            {seasons.length > 0 && <SeasonGrid seasons={seasons} />}
            <CompareTripsPicker
              trips={trips.map((t) => ({
                id: t.id,
                title: t.title,
                area: t.area,
                startDate: t.startDate ?? null,
                stats: t.stats,
                profile: t.profile,
              }))}
            />
            <section className="mt-2xl">
              <h2 className="font-heading text-h2 font-bold text-forest mb-lg">
                Alle gjennomførte turer
              </h2>
              <ul className="grid gap-lg">
                {trips.map((t, i) => (
                  <li key={t.id}>
                    <TripStatsCard trip={t} tilt={i % 2 === 0 ? 0.3 : -0.3} />
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div
      className="bg-bg border-4 border-flame-pressed rounded-lg p-xl text-center shadow-[6px_6px_0_var(--brand-flame-pressed)]"
      style={{ transform: "rotate(-0.4deg)" }}
    >
      <p
        className="text-text-primary text-2xl leading-snug mb-md"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 700 }}
      >
        Ingen fullførte turer ennå. Statistikken venter.
      </p>
      <Link
        href="/tur/ny"
        className="inline-flex h-11 items-center justify-center rounded-md bg-flame-primary px-lg text-body font-bold text-white shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:bg-flame-hover hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-all"
      >
        Lag ny tur
      </Link>
    </div>
  );
}

function Totals({ totals }: { totals: ReturnType<typeof aggregateStats> }) {
  const cards = [
    { label: "Turer", value: String(totals.trips) },
    { label: "Distanse", value: `${totals.distanceKm.toFixed(1)} km` },
    { label: "Høydemeter", value: `${totals.elevationGain} m` },
    { label: "Dager ute", value: String(totals.totalDays) },
  ];
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-md mb-xl">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-bg border-4 border-flame-pressed rounded-lg p-md shadow-[4px_4px_0_var(--brand-flame-pressed)]"
        >
          <p
            className="text-xs uppercase tracking-label font-bold text-text-muted mb-xs"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            {c.label}
          </p>
          <p className="font-heading text-h2 font-black text-flame-pressed">
            {c.value}
          </p>
        </div>
      ))}
    </section>
  );
}

function SeasonGrid({
  seasons,
}: {
  seasons: Array<[string, { trips: number; distanceKm: number; elevationGain: number }]>;
}) {
  return (
    <section className="mb-xl">
      <h2 className="font-heading text-h2 font-bold text-forest mb-md">
        Per sesong
      </h2>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-md">
        {seasons.map(([name, s]) => (
          <li
            key={name}
            className="bg-bg border-2 border-fjord rounded-md p-md shadow-[3px_3px_0_var(--accent-fjord)]"
          >
            <p
              className="text-xs uppercase tracking-label font-bold text-fjord mb-xs"
              style={{ fontFamily: "var(--font-stamp)" }}
            >
              {name}
            </p>
            <p className="text-sm text-text-primary font-bold">
              {s.trips} turer
            </p>
            <p className="text-xs text-text-muted mt-xs">
              {s.distanceKm.toFixed(1)} km · {s.elevationGain} hm
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TripStatsCard({ trip, tilt }: { trip: PastTripView; tilt: number }) {
  return (
    <div
      className="bg-bg border-4 border-flame-pressed rounded-lg overflow-hidden shadow-[6px_6px_0_var(--brand-flame-pressed)]"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="bg-flame-pressed text-white p-md flex items-baseline justify-between gap-md flex-wrap">
        <div>
          <p
            className="text-xs font-bold opacity-90 mb-1 uppercase tracking-label"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            {formatDate(trip.startDate)}
            {trip.area ? ` · ${trip.area}` : ""}
          </p>
          <h3 className="font-heading text-h2 font-black leading-tight">
            {trip.title}
          </h3>
        </div>
        <p className="text-sm opacity-95 font-bold">
          {trip.stats.distanceKm.toFixed(1)} km · {trip.stats.elevationGain} hm
          {trip.stats.durationDays ? ` · ${trip.stats.durationDays} dager` : ""}
        </p>
      </div>
      <div className="p-md">
        <ElevationProfile points={trip.profile} title="Høydeprofil" />
        <div className="mt-md flex items-center justify-end gap-md">
          <Link
            href={`/tur/${trip.id}`}
            className="text-sm font-bold text-flame-pressed hover:text-flame-primary"
          >
            Åpne tur →
          </Link>
        </div>
      </div>
    </div>
  );
}
