import Link from "next/link";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITrip } from "@/models/Trip";
import { MonsenLine } from "@/components/lars-monsen/monsen-line";
import { DeleteTripButton } from "./delete-trip-button";
import { DuplicateTripButton } from "@/components/trips/duplicate-trip-button";
import { computeTripStats, type TripStats } from "@/lib/trips/stats";

type TripCard = {
  id: string;
  title: string;
  area: string;
  start?: Date;
  end?: Date;
  participantCount: number;
  stats: TripStats;
};

type AnnualSuggestion = {
  id: string;
  title: string;
  area: string;
  start: Date;
  end?: Date;
};

async function getTrips(): Promise<{
  upcoming: TripCard[];
  past: TripCard[];
  annualSuggestion: AnnualSuggestion | null;
}> {
  try {
    await connectToDatabase();
    const docs = await Trip.find({})
      .sort({ startDate: 1, updatedAt: -1 })
      .limit(50)
      .lean<ITrip[]>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: TripCard[] = [];
    const past: TripCard[] = [];

    for (const d of docs) {
      const card: TripCard = {
        id: String(d._id),
        title: d.title,
        area: d.area ?? "",
        start: d.startDate,
        end: d.endDate,
        participantCount: d.participants?.length ?? 0,
        stats: computeTripStats(d.legs, d.cabins, d.startDate, d.endDate),
      };
      const startDate = d.startDate ? new Date(d.startDate) : null;
      if (!startDate || startDate >= today) {
        upcoming.push(card);
      } else {
        past.push(card);
      }
    }

    upcoming.sort((a, b) => {
      if (!a.start) return -1;
      if (!b.start) return 1;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
    past.sort((a, b) => {
      if (!a.start) return 1;
      if (!b.start) return -1;
      return new Date(b.start).getTime() - new Date(a.start).getTime();
    });

    return { upcoming, past, annualSuggestion: pickAnnualSuggestion(past) };
  } catch {
    return { upcoming: [], past: [], annualSuggestion: null };
  }
}

function pickAnnualSuggestion(past: TripCard[]): AnnualSuggestion | null {
  const now = Date.now();
  const oneYear = 365 * 86400000;
  const window = 45 * 86400000;
  let best: { card: TripCard; delta: number } | null = null;
  for (const t of past) {
    if (!t.start) continue;
    const delta = Math.abs(now - new Date(t.start).getTime() - oneYear);
    if (delta <= window && (!best || delta < best.delta)) {
      best = { card: t, delta };
    }
  }
  if (!best) return null;
  return {
    id: best.card.id,
    title: best.card.title,
    area: best.card.area,
    start: best.card.start as Date,
    end: best.card.end,
  };
}

function formatDateRange(start?: Date, end?: Date): string {
  if (!start) return "Dato ikke satt";
  const fmt = new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const s = fmt.format(new Date(start));
  if (!end) return s;
  return `${s} – ${fmt.format(new Date(end))}`;
}

export default async function TurerPage() {
  const { upcoming, past, annualSuggestion } = await getTrips();

  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-md py-xl sm:px-lg sm:py-2xl">
        <header className="mb-xl">
          <h1 className="font-heading text-h1 font-bold mb-xs text-text-primary">
            Turer
          </h1>
          <p
            className="text-text-primary text-xl leading-snug mb-md"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            Dine kommende og tidligere turer.
          </p>
          <MonsenLine category="logTitle" variant="card" />
        </header>

        {annualSuggestion && (
          <AnnualRepeatBanner suggestion={annualSuggestion} />
        )}

        <section className="mb-2xl">
          <h2 className="font-heading text-h2 font-bold text-forest mb-lg">
            Mine turer
          </h2>
          {upcoming.length === 0 ? (
            <EmptyUpcoming />
          ) : (
            <ul className="grid gap-lg">
              {upcoming.map((t, i) => (
                <li key={t.id}>
                  <TripRow trip={t} tilt={i % 2 === 0 ? 0.5 : -0.5} deletable />
                </li>
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-lg">
              <h2 className="font-heading text-h2 font-bold text-text-muted">
                Turlogg
              </h2>
              <Link
                href="/statistikk"
                className="text-sm font-bold text-flame-pressed hover:text-flame-primary transition-colors"
              >
                Se statistikk →
              </Link>
            </div>
            <ul className="grid gap-lg">
              {past.map((t, i) => (
                <li key={t.id}>
                  <TripRow
                    trip={t}
                    tilt={i % 2 === 0 ? 0.4 : -0.4}
                    muted
                    duplicatable
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function AnnualRepeatBanner({ suggestion }: { suggestion: AnnualSuggestion }) {
  const startIso = suggestion.start.toISOString().slice(0, 10);
  const endIso = suggestion.end ? suggestion.end.toISOString().slice(0, 10) : undefined;
  return (
    <aside
      className="mb-xl bg-midnight-sun-tint border-4 border-midnight-sun rounded-lg p-lg shadow-[6px_6px_0_var(--accent-midnight-sun)]"
      style={{ transform: "rotate(-0.4deg)" }}
    >
      <p
        className="text-xs uppercase tracking-label font-bold text-midnight-sun mb-xs"
        style={{ fontFamily: "var(--font-stamp)" }}
      >
        Lars minner deg på
      </p>
      <h3 className="font-heading text-h2 font-bold text-text-primary mb-xs">
        Det er omtrent ett år siden &laquo;{suggestion.title}&raquo;.
      </h3>
      <p
        className="text-text-primary text-lg leading-snug mb-md"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        Sesongen nærmer seg igjen. Skal vi ta den om igjen, samme rute, nye
        datoer?
      </p>
      <DuplicateTripButton
        tripId={suggestion.id}
        defaultTitle={suggestion.title}
        defaultStart={startIso}
        defaultEnd={endIso}
        variant="panel"
        label="Gjenta turen"
      />
    </aside>
  );
}

function StatLine({ stats }: { stats: TripStats }) {
  if (stats.legCount === 0) {
    return (
      <span className="text-xs text-text-muted">Ingen etapper registrert</span>
    );
  }
  const parts: string[] = [];
  parts.push(`${stats.distanceKm.toFixed(1)} km`);
  if (stats.elevationGain > 0) parts.push(`${stats.elevationGain} hm`);
  if (stats.durationDays) parts.push(`${stats.durationDays} dager`);
  else if (stats.legCount > 0) parts.push(`${stats.legCount} etapper`);
  return (
    <span className="text-xs text-text-muted font-semibold">
      {parts.join(" · ")}
    </span>
  );
}

function TripRow({
  trip,
  tilt,
  muted = false,
  deletable = false,
  duplicatable = false,
}: {
  trip: TripCard;
  tilt: number;
  muted?: boolean;
  deletable?: boolean;
  duplicatable?: boolean;
}) {
  const startIso = trip.start ? trip.start.toISOString().slice(0, 10) : undefined;
  const endIso = trip.end ? trip.end.toISOString().slice(0, 10) : undefined;
  return (
    <div
      className="bg-bg border-4 border-flame-pressed rounded-lg overflow-hidden shadow-[6px_6px_0_var(--brand-flame-pressed)]"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <Link
        href={`/tur/${trip.id}`}
        className="block hover:-translate-y-[1px] transition-transform"
      >
        <div
          className={`${muted ? "bg-text-muted" : "bg-flame-pressed"} text-white p-md`}
        >
          <p
            className="text-xs font-bold opacity-90 mb-1 uppercase tracking-label"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            {formatDateRange(trip.start, trip.end)}
            {trip.area ? ` · ${trip.area}` : ""}
          </p>
          <h3 className="font-heading text-h2 font-black leading-tight">
            {trip.title}
          </h3>
        </div>
      </Link>
      <div className="p-md flex justify-between items-center gap-md flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-flame-primary font-bold text-sm">
            {trip.participantCount > 0
              ? `${trip.participantCount} ${trip.participantCount === 1 ? "deltaker" : "deltakere"}`
              : "Ingen deltakere ennå"}
          </span>
          <StatLine stats={trip.stats} />
        </div>
        <div className="flex items-center gap-md">
          {duplicatable && (
            <DuplicateTripButton
              tripId={trip.id}
              defaultTitle={trip.title}
              defaultStart={startIso}
              defaultEnd={endIso}
              variant="compact"
            />
          )}
          {deletable && <DeleteTripButton tripId={trip.id} />}
          <Link
            href={`/tur/${trip.id}`}
            className="text-flame-pressed text-sm font-bold hover:text-flame-primary transition-colors"
          >
            Åpne →
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyUpcoming() {
  return (
    <div
      className="text-center"
      style={{ transform: "rotate(-0.5deg)" }}
    >
      <MonsenLine category="logEmpty" variant="card" align="center" />
      <Link
        href="/tur/ny"
        className="inline-flex mt-lg h-11 items-center justify-center rounded-md bg-flame-primary px-lg text-body font-bold text-white shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:bg-flame-hover hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-all"
      >
        Lag ny tur
      </Link>
    </div>
  );
}
