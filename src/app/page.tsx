import Image from "next/image";
import Link from "next/link";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITrip } from "@/models/Trip";
import { fetchLocationForecast } from "@/lib/met";
import { pickQuips } from "@/lib/lars-monsen/quips";

const OSLO = { lat: 59.9139, lon: 10.7522 };

const SUGGESTIONS = [
  { label: "Helgetur i mars", q: "helgetur mars" },
  { label: "Familietur", q: "familietur" },
  { label: "Hytte-til-hytte", q: "hytte til hytte" },
];

type LatestTrip = {
  id: string;
  inviteToken: string;
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
      inviteToken: doc.inviteToken,
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

async function getOsloWeather() {
  try {
    const f = await fetchLocationForecast(OSLO.lat, OSLO.lon, {
      revalidate: 1800,
    });
    const now = f.timeseries[0]?.data.instant.details;
    const sym = f.timeseries[0]?.data.next_1_hours?.summary?.symbol_code ?? "";
    if (!now) return null;
    return {
      tempC: Math.round(now.air_temperature ?? 0),
      windMs: Math.round(now.wind_speed ?? 0),
      symbol: sym,
    };
  } catch {
    return null;
  }
}

function symbolToWord(symbol: string): string {
  if (!symbol) return "Vær";
  if (symbol.includes("clearsky")) return "Sol";
  if (symbol.includes("fair")) return "Lettskyet";
  if (symbol.includes("cloudy")) return "Skyet";
  if (symbol.includes("rain")) return "Regn";
  if (symbol.includes("snow")) return "Snø";
  if (symbol.includes("fog")) return "Tåke";
  return "Vær";
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "God natt";
  if (h < 11) return "God morgen";
  if (h < 17) return "God dag";
  return "God kveld";
}

function formatTripDates(start?: Date, end?: Date): string {
  if (!start) return "Snart";
  const fmt = new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
  });
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
  const [trip, weather] = await Promise.all([getLatestTrip(), getOsloWeather()]);
  const tripHref = trip ? `/tur/${trip.id}` : "/tur/demo";
  const badge = trip
    ? tripStatusBadge(trip.participants)
    : { label: "Demo", tone: "wait" as const };
  const [wisdomTop, footerQuote] = pickQuips("homeWisdom", 2);

  return (
    <main className="bg-flame-primary text-white relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.06), transparent 50%), radial-gradient(circle at 80% 100%, rgba(0,0,0,0.12), transparent 50%)",
        }}
      />

      <div className="relative max-w-[42rem] mx-auto px-md py-xl sm:px-lg sm:py-2xl">
        <header className="flex justify-between items-start mb-lg">
          <div>
            <p className="text-sm opacity-90">
              {greeting()}, <strong>turkamerat!</strong>
            </p>
            <p className="text-xs opacity-75 mt-1">
              {weather
                ? `${symbolToWord(weather.symbol)} i Oslo - ${weather.tempC}° - vind ${weather.windMs} m/s`
                : "Oslo - friluftsvær venter"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-flame-primary font-heading font-bold border-2 border-flame-pressed">
            LM
          </div>
        </header>

        <h1
          className="font-heading font-bold leading-[0.95] mb-md"
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
          className="bg-bg border-4 border-flame-pressed rounded-lg p-md flex items-center gap-sm mb-lg shadow-[4px_4px_0_var(--brand-flame-pressed)]"
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

        <div className="flex flex-wrap gap-sm mb-xl pb-sm">
          <Link
            href="/discover?inspire=1"
            className="inline-flex items-center justify-center px-md py-sm bg-bg text-flame-pressed border-2 border-flame-pressed rounded-pill font-bold shadow-[2px_2px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] transition-transform"
            style={{
              fontFamily: "var(--font-handwriting)",
              fontSize: "16px",
            }}
          >
            Lars Monsen foreslår
          </Link>
          {SUGGESTIONS.map((s) => (
            <Link
              key={s.label}
              href={`/discover?q=${encodeURIComponent(s.q)}`}
              className="inline-flex items-center justify-center px-sm py-sm bg-flame-pressed text-white border-2 border-white rounded-pill font-bold text-xs hover:bg-flame-hover transition-colors"
            >
              {s.label}
            </Link>
          ))}
        </div>

        <section className="bg-bg border-4 border-flame-pressed rounded-lg p-lg pl-[112px] mb-lg relative min-h-[120px] shadow-[6px_6px_0_var(--brand-flame-pressed)]">
          <span
            className="absolute -top-3 right-2 bg-forest text-white text-xs font-bold px-sm py-1 rounded border-2 border-forest uppercase tracking-label"
            style={{
              fontFamily: "var(--font-stamp)",
              transform: "rotate(4deg)",
            }}
          >
            LARS MONSEN GODKJENT
          </span>
          <div
            className="absolute left-2 top-1/2 w-24 h-24 -translate-y-1/2"
            style={{ transform: "translateY(-50%) rotate(-4deg)" }}
          >
            <Image
              src="/lars-monsen-kayak.png"
              alt="Lars Monsen"
              width={96}
              height={96}
              className="w-full h-full object-cover rounded border-2 border-flame-primary"
            />
          </div>
          <h3
            className="text-flame-primary font-bold text-2xl mb-1"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            Heisann, turkamerat!
          </h3>
          <p className="text-text-primary text-sm font-medium leading-snug">
            Tre helger framover ser fine ut.
            <br />
            Jeg har plukka noen som passer dere.
          </p>
        </section>

        <WisdomQuote quote={wisdomTop} tilt={1} />

        <div className="flex justify-between items-baseline mb-md">
          <h2 className="font-heading font-bold text-2xl">Mine turer</h2>
          <Link
            href="/logg"
            className="text-xs font-bold uppercase tracking-label underline underline-offset-4"
          >
            Se alle
          </Link>
        </div>

        <Link
          href={tripHref}
          className="block bg-bg border-4 border-flame-pressed rounded-lg overflow-hidden mb-xl relative shadow-[6px_6px_0_var(--brand-flame-pressed)] hover:-translate-y-[2px] transition-transform"
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
              <span className="bg-flame-hover text-white text-xs font-bold px-sm py-1 rounded-pill">
                ⚠ Vær endret
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

        <footer className="mt-2xl text-center pb-xl">
          <p
            className="text-2xl opacity-95 mb-1"
            style={{
              fontFamily: "var(--font-handwriting)",
              fontWeight: 700,
            }}
          >
            &ldquo;{footerQuote}&rdquo;
          </p>
          <p className="text-sm opacity-75">- Lars Monsen</p>
        </footer>
      </div>
    </main>
  );
}

function WisdomQuote({ quote, tilt }: { quote: string; tilt: number }) {
  return (
    <div
      className="bg-bg border-4 border-flame-pressed rounded-lg p-lg pl-[64px] mb-lg relative shadow-[6px_6px_0_rgba(0,0,0,0.15)]"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span
        className="absolute left-md top-1 text-7xl text-flame-primary/40 leading-none"
        style={{ fontFamily: "var(--font-heading)" }}
        aria-hidden
      >
        &ldquo;
      </span>
      <p
        className="text-text-primary text-xl leading-snug mb-1"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 700 }}
      >
        {quote}
      </p>
      <p
        className="text-flame-pressed text-base"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        - Lars Monsen
      </p>
    </div>
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
