import Image from "next/image";
import Link from "next/link";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITrip } from "@/models/Trip";

type LatestTrip = {
  id: string;
  title: string;
  area: string;
  start?: Date;
  end?: Date;
  participants: { name: string; status: string }[];
};

async function getLatestTrip(): Promise<LatestTrip | null> {
  try {
    await connectToDatabase();
    const doc = await Trip.findOne({})
      .sort({ updatedAt: -1 })
      .lean<ITrip | null>();
    if (!doc) return null;
    return {
      id: String(doc._id),
      title: doc.title,
      area: doc.area,
      start: doc.startDate,
      end: doc.endDate,
      participants: (doc.participants ?? []).map((p) => ({
        name: p.name,
        status: p.status,
      })),
    };
  } catch {
    return null;
  }
}

function formatTripDates(start?: Date, end?: Date): string {
  if (!start) return "Snart";
  const fmt = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "short" });
  const s = fmt.format(new Date(start));
  if (!end) return s;
  return `${s.replace(".", "")} - ${fmt.format(new Date(end)).replace(".", "")}`;
}

function tripStatusBadge(participants: { status: string }[]) {
  const accepted = participants.filter((p) => p.status === "accepted").length;
  const total = participants.length;
  if (total === 0) return { label: "Utkast", tone: "draft" as const };
  if (accepted === total) return { label: "Bekreftet", tone: "ok" as const };
  return { label: `${accepted}/${total} ja`, tone: "wait" as const };
}

const wiggleSvg =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'><path d='M2 5 Q40 1 80 4 T160 3 Q180 4 198 5' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/></svg>\")";

export default async function HomePage() {
  const trip = await getLatestTrip();
  const tripHref = trip ? `/tur/${trip.id}` : "/tur/demo";
  const badge = trip
    ? tripStatusBadge(trip.participants)
    : { label: "Demo", tone: "wait" as const };
  return (
    <main className="bg-flame-primary text-white relative overflow-hidden min-h-screen">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.06), transparent 50%), radial-gradient(circle at 80% 100%, rgba(0,0,0,0.12), transparent 50%)",
        }}
      />

      <div className="relative max-w-[42rem] mx-auto px-md sm:px-lg">

        {/* Illustration centered in space above title */}
        <div className="flex items-center justify-center" style={{ height: "38vh" }}>
          <Image
            src="/lars-monsen-illustration.png"
            alt="Lars Monsen"
            width={320}
            height={320}
            className="h-full w-auto object-contain drop-shadow-xl"
            priority
          />
        </div>

        {/* Title + search */}
        <div className="flex flex-col items-center text-center pb-xl">
          <h1
            className="font-heading font-bold leading-[0.95] mb-lg"
            style={{ fontSize: "clamp(40px, 9vw, 64px)" }}
          >
            Hvor vil du{" "}
            <span className="relative inline-block">
              <span className="relative z-10">på tur?</span>
              <span
                className="absolute bottom-0 left-0 right-0 h-2"
                style={{
                  backgroundImage: wiggleSvg,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "0 100%",
                  backgroundSize: "100% 8px",
                }}
              />
            </span>
          </h1>

          <form
            action="/discover"
            method="get"
            className="w-full bg-bg border-4 border-flame-pressed rounded-lg p-md flex items-center gap-sm shadow-[4px_4px_0_var(--brand-flame-pressed)]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-flame-primary shrink-0"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-5-5" />
            </svg>
            <input
              type="text"
              name="q"
              placeholder="Hyttetur i mars, Rondane, eller Galdhøpiggen..."
              className="flex-1 bg-transparent border-none outline-none text-text-primary font-semibold placeholder:text-flame-primary/60 min-w-0"
            />
            <button
              type="submit"
              className="hidden sm:inline-flex h-9 items-center justify-center rounded-md bg-flame-primary px-md text-sm font-bold text-white hover:bg-flame-hover transition-colors"
            >
              Søk
            </button>
          </form>
        </div>

        {/* Lars Monsen button */}
        <div className="flex mb-xl">
          <Link
            href="/lars-foreslar"
            className="inline-flex items-center justify-center px-md py-sm bg-bg text-flame-pressed border-2 border-flame-pressed rounded-pill font-bold shadow-[2px_2px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] transition-transform"
            style={{ fontFamily: "var(--font-handwriting)", fontSize: "16px" }}
          >
            Lars Monsen foreslår
          </Link>
        </div>

        {/* Mine turer */}
        <div className="flex justify-between items-baseline mb-md">
            <h2 className="font-heading font-bold text-2xl">Mine turer</h2>
            <Link
              href="/turer"
              className="text-xs font-bold uppercase tracking-label underline underline-offset-4"
            >
              Se alle
            </Link>
          </div>

          <Link
            href={tripHref}
            className="w-full block bg-bg border-4 border-flame-pressed rounded-lg overflow-hidden mb-xl relative shadow-[6px_6px_0_var(--brand-flame-pressed)] hover:-translate-y-[2px] transition-transform"
            style={{ transform: "rotate(1.2deg)" }}
          >
            <span
              className="absolute -top-2 -left-2 w-16 h-5 bg-white/40 shadow-sm pointer-events-none"
              style={{ transform: "rotate(-32deg)" }}
            />
            <div className="bg-flame-pressed text-white p-md h-32 flex flex-col justify-between">
              <div className="flex justify-between gap-sm">
                <span className="bg-bg text-flame-primary text-xs font-bold px-sm py-1 rounded-pill">
                  {badge.label}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold opacity-90 mb-1">
                  {trip
                    ? `${formatTripDates(trip.start, trip.end)}${trip.area ? ` - ${trip.area}` : ""}`
                    : "14 - 16 mars - Rondane"}
                </p>
                <h3 className="font-heading font-black text-xl leading-tight">
                  {trip ? trip.title : "Fjols til Fjells"}
                </h3>
              </div>
            </div>
            <div className="p-md flex justify-between items-center">
              <span className="text-flame-primary font-bold text-sm">
                {trip
                  ? `${trip.participants.filter((p) => p.status === "accepted").length} av ${Math.max(trip.participants.length, 1)} har sagt ja`
                  : "3 av 3 har sagt ja"}
              </span>
              <ParticipantAvatars
                names={
                  trip && trip.participants.length > 0
                    ? trip.participants.map((p) => p.name)
                    : ["Une", "Ola", "Maja"]
                }
              />
            </div>
          </Link>

      </div>
    </main>
  );
}

function ParticipantAvatars({ names }: { names: string[] }) {
  const shown = names.slice(0, 3);
  return (
    <div className="flex">
      {shown.map((n, i) => (
        <span
          key={`${n}-${i}`}
          className="w-6 h-6 rounded-full bg-bg border-2 border-flame-primary flex items-center justify-center text-xs font-bold text-flame-primary"
          style={{ marginLeft: i === 0 ? 0 : -8 }}
        >
          {n.charAt(0).toUpperCase()}
        </span>
      ))}
    </div>
  );
}
