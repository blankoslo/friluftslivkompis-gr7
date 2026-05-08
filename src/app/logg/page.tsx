import Link from "next/link";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITrip } from "@/models/Trip";

type LoggTrip = {
  id: string;
  title: string;
  area: string;
  start?: Date;
  end?: Date;
  participantCount: number;
};

async function getTrips(): Promise<LoggTrip[]> {
  try {
    await connectToDatabase();
    const docs = await Trip.find({})
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean<ITrip[]>();
    return docs.map((d) => ({
      id: String(d._id),
      title: d.title,
      area: d.area ?? "",
      start: d.startDate,
      end: d.endDate,
      participantCount: d.participants?.length ?? 0,
    }));
  } catch {
    return [];
  }
}

function formatDateRange(start?: Date, end?: Date): string {
  if (!start) return "Snart";
  const fmt = new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
  });
  const s = fmt.format(new Date(start));
  if (!end) return s;
  return `${s} - ${fmt.format(new Date(end))}`;
}

export default async function LoggPage() {
  const trips = await getTrips();

  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-md py-xl sm:px-lg sm:py-2xl">
        <header className="mb-xl">
          <h1 className="font-heading text-h1 font-bold mb-xs text-text-primary">
            Turlogg
          </h1>
          <p
            className="text-text-primary text-xl leading-snug"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            Historikk, statistikk og tidligere turer.
          </p>
        </header>

        {trips.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-lg">
            {trips.map((t, i) => (
              <li key={t.id}>
                <TripRow trip={t} tilt={i % 2 === 0 ? 0.6 : -0.6} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function TripRow({ trip, tilt }: { trip: LoggTrip; tilt: number }) {
  return (
    <Link
      href={`/tur/${trip.id}`}
      className="block bg-bg border-4 border-flame-pressed rounded-lg overflow-hidden shadow-[6px_6px_0_var(--brand-flame-pressed)] hover:-translate-y-[2px] transition-transform"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="bg-flame-pressed text-white p-md">
        <p
          className="text-xs font-bold opacity-90 mb-1 uppercase tracking-label"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          {formatDateRange(trip.start, trip.end)}
          {trip.area ? ` - ${trip.area}` : ""}
        </p>
        <h2 className="font-heading text-h2 font-black leading-tight">
          {trip.title}
        </h2>
      </div>
      <div className="p-md flex justify-between items-center">
        <span className="text-flame-primary font-bold text-sm">
          {trip.participantCount > 0
            ? `${trip.participantCount} ${trip.participantCount === 1 ? "deltaker" : "deltakere"}`
            : "Ingen deltakere ennå"}
        </span>
        <span className="text-flame-pressed text-sm font-bold">Åpne →</span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div
      className="bg-bg border-4 border-flame-pressed rounded-lg p-xl text-center shadow-[6px_6px_0_var(--brand-flame-pressed)]"
      style={{ transform: "rotate(-0.5deg)" }}
    >
      <p
        className="text-text-primary text-2xl leading-snug mb-md"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 700 }}
      >
        Ingen turer å vise enda. La oss endre på det.
      </p>
      <p
        className="text-flame-pressed mb-lg"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        - Lars
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
