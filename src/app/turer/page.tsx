import Link from "next/link";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITrip } from "@/models/Trip";
import { MonsenLine } from "@/components/lars-monsen/monsen-line";
import { DeleteTripButton } from "./delete-trip-button";

type TripCard = {
  id: string;
  title: string;
  area: string;
  start?: Date;
  end?: Date;
  participantCount: number;
};

async function getTrips(): Promise<{ upcoming: TripCard[]; past: TripCard[] }> {
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
      };
      const startDate = d.startDate ? new Date(d.startDate) : null;
      if (!startDate || startDate >= today) {
        upcoming.push(card);
      } else {
        past.push(card);
      }
    }

    // upcoming: soonest first; past: most recent first
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

    return { upcoming, past };
  } catch {
    return { upcoming: [], past: [] };
  }
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
  const { upcoming, past } = await getTrips();

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
          <MonsenLine category="logTitle" variant="card" align="center" />
        </header>

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
            <h2 className="font-heading text-h2 font-bold text-text-muted mb-lg">
              Turlogg
            </h2>
            <ul className="grid gap-lg">
              {past.map((t, i) => (
                <li key={t.id}>
                  <TripRow trip={t} tilt={i % 2 === 0 ? 0.4 : -0.4} muted />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function TripRow({
  trip,
  tilt,
  muted = false,
  deletable = false,
}: {
  trip: TripCard;
  tilt: number;
  muted?: boolean;
  deletable?: boolean;
}) {
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
      <div className="p-md flex justify-between items-center">
        <span className="text-flame-primary font-bold text-sm">
          {trip.participantCount > 0
            ? `${trip.participantCount} ${trip.participantCount === 1 ? "deltaker" : "deltakere"}`
            : "Ingen deltakere ennå"}
        </span>
        <div className="flex items-center gap-md">
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
      className="bg-bg border-4 border-flame-pressed rounded-lg p-xl text-center shadow-[6px_6px_0_var(--brand-flame-pressed)]"
      style={{ transform: "rotate(-0.5deg)" }}
    >
      <p
        className="text-text-primary text-2xl leading-snug mb-md"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 700 }}
      >
        Ingen turer planlagt ennå. La oss endre på det.
      </p>
      <p
        className="text-flame-pressed mb-lg"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        — Lars
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
