import type { TripTimeline } from "@/lib/timeline";
import type { RouteLeg } from "@/lib/route";
import type { DailyWeather } from "@/lib/met";
import { WeatherSymbol, weatherLabel } from "./weather-symbol";
import { cn } from "@/lib/utils";
import { randomQuip } from "@/lib/lars-monsen/quips";
import { reliabilityExplanation } from "@/components/ui/ai-disclosure";

const DIFFICULTY_LABEL: Record<RouteLeg["difficulty"], string> = {
  easy: "Lett",
  moderate: "Middels",
  tough: "Krevende",
};

const DIFFICULTY_STYLES: Record<RouteLeg["difficulty"], string> = {
  easy: "bg-forest text-white",
  moderate: "bg-fjord text-white",
  tough: "bg-flame-hover text-white",
};

const RELIABILITY_LABEL: Record<DailyWeather["reliability"], string> = {
  high: "Sikker",
  medium: "Brukbar",
  low: "Usikker",
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("no-NB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("no-NB", { day: "numeric", month: "long" });
}

const FORECAST_HORIZON_DAYS = 9;

function daysUntil(iso: string): number {
  const target = new Date(iso + "T00:00:00Z").getTime();
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime();
  return Math.round((target - today) / (24 * 3600 * 1000));
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const SEASON_HINT: Record<number, string> = {
  1: "Januar i fjellet: -15 til -5°C, mye snø, korte dagslys. Vinterutstyr.",
  2: "Februar: -12 til -3°C, stabil snø, sol kommer tilbake. Solbriller + ulltrøye.",
  3: "Mars: -8 til 2°C, perfekt skiføre, lange dager. Vindjakke + solbeskyttelse.",
  4: "April: -3 til 7°C, vekslende, råttent isføre. Skred-fare i sør.",
  5: "Mai: 2 til 12°C, snøsmelting, mye vann i elver. Vannfaste støvler + mygg.",
  6: "Juni: 5 til 15°C, kjølige netter, mye lys, mygg starter. Skift + mygmiddel.",
  7: "Juli: 8 til 18°C, varmest, mye nedbør, mygg + knott. Kortbukse + ulltrøye.",
  8: "August: 6 til 16°C, bær-sesong, kortere kvelder. Regnjakke + ulltrøye.",
  9: "September: 2 til 10°C, høstfarger, første nattefrost. Lue + varme sokker.",
  10: "Oktober: -3 til 6°C, snø i fjellet, mørke kvelder. Vintersko + hodelykt.",
  11: "November: -8 til 1°C, ustabil snø, mørketid starter. Full vinterpakking.",
  12: "Desember: -12 til -3°C, mørketid, snø. Vinterutstyr + termos.",
};

function seasonHint(iso: string): string {
  const month = Number(iso.slice(5, 7));
  return SEASON_HINT[month] ?? "Pakk for vekslende norsk vær.";
}

function StatBlock({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <span
        className="text-small uppercase tracking-label text-flame-pressed font-bold"
        style={{ fontFamily: "var(--font-stamp)" }}
      >
        {label}
      </span>
      <span className="font-heading text-h3 font-bold text-text-primary">
        {value}
        {unit ? <span className="text-text-muted text-body ml-1">{unit}</span> : null}
      </span>
    </div>
  );
}

export function TimelineSummary({ timeline }: { timeline: TripTimeline }) {
  const { totals, days } = timeline;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-md p-md rounded-md border-2 border-flame-pressed bg-bg shadow-[4px_4px_0_var(--brand-flame-pressed)]">
      <StatBlock label="Dager" value={String(days.length)} />
      <StatBlock label="Distanse" value={totals.distanceKm.toFixed(1)} unit="km" />
      <StatBlock label="Stigning" value={String(totals.elevationGain)} unit="m" />
      <StatBlock label="Estimert tid" value={totals.estimatedHours.toFixed(1)} unit="t" />
    </div>
  );
}

function WeatherBlock({
  weather,
  date,
}: {
  weather: DailyWeather | null;
  date: string | null;
}) {
  if (!weather) {
    if (date) {
      const days = daysUntil(date);
      if (days > FORECAST_HORIZON_DAYS) {
        const horizonDate = addDaysISO(date, -FORECAST_HORIZON_DAYS);
        return (
          <div className="flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <span
                className="inline-flex w-fit text-xs font-bold px-sm py-1 rounded-pill uppercase tracking-label bg-fjord text-white"
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                Sesong-snitt
              </span>
              <span className="text-small text-text-muted">
                Prognose tilgjengelig fra {formatShortDate(horizonDate)}
              </span>
            </div>
            <span className="text-body text-text-primary leading-snug">
              {seasonHint(date)}
            </span>
            <span
              className="text-base text-text-muted leading-snug"
              style={{ fontFamily: "var(--font-handwriting)" }}
            >
              {randomQuip("weatherOutOfHorizon")}
            </span>
          </div>
        );
      }
    }
    return (
      <div
        className="flex items-center gap-sm text-text-muted text-base"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        Værvarsel mangler
      </div>
    );
  }
  return (
    <div className="flex items-start gap-md">
      <WeatherSymbol code={weather.symbolCode} />
      <div className="flex flex-col gap-xs flex-1">
        <span className="text-body font-semibold text-text-primary">
          {weatherLabel(weather.symbolCode)}
        </span>
        <div className="flex flex-wrap gap-md text-small text-text-muted">
          {weather.tempMin !== null && weather.tempMax !== null && (
            <span>
              {Math.round(weather.tempMin)}°-{Math.round(weather.tempMax)}°C
            </span>
          )}
          {weather.precipMm > 0 && <span>{weather.precipMm.toFixed(1)} mm nedbør</span>}
          {weather.windMaxMs !== null && (
            <span>vind {Math.round(weather.windMaxMs)} m/s</span>
          )}
        </div>
        {weather.reliability !== "high" && (
          <div className="flex flex-col gap-xs">
            <span
              className={cn(
                "inline-flex w-fit text-xs font-bold px-sm py-1 rounded-pill uppercase tracking-label",
                weather.reliability === "low"
                  ? "bg-flame-hover text-white"
                  : "bg-fjord text-white",
              )}
              style={{ fontFamily: "var(--font-stamp)" }}
            >
              {RELIABILITY_LABEL[weather.reliability]} prognose
            </span>
            <span className="text-xs text-text-muted leading-snug">
              {reliabilityExplanation(weather.reliability)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function TimelineDayCard({
  day,
}: {
  day: TripTimeline["days"][number];
}) {
  const { leg, weather, date, dayNumber } = day;
  return (
    <article className="rounded-lg border-4 border-flame-pressed bg-bg shadow-[6px_6px_0_var(--brand-flame-pressed)] overflow-hidden">
      <header className="flex items-center justify-between gap-md px-md py-sm bg-flame-pressed text-white">
        <div className="flex items-center gap-md">
          <span className="font-heading text-h3 font-bold">Dag {dayNumber}</span>
          {date && (
            <span className="text-small opacity-90 capitalize">
              {formatDate(date)}
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-xs font-bold px-sm py-1 rounded-pill uppercase tracking-label",
            DIFFICULTY_STYLES[leg.difficulty],
          )}
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          {DIFFICULTY_LABEL[leg.difficulty]}
        </span>
      </header>
      <div className="grid md:grid-cols-2 gap-md p-md">
        <div className="flex flex-col gap-sm">
          <div className="flex items-baseline gap-sm flex-wrap">
            <span className="font-heading text-body font-bold text-text-primary">
              {leg.from.name}
            </span>
            <span className="text-flame-primary font-bold">→</span>
            <span className="font-heading text-body font-bold text-text-primary">
              {leg.to.name}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-sm">
            <StatBlock label="Distanse" value={leg.distanceKm.toFixed(1)} unit="km" />
            <StatBlock
              label="Stigning"
              value={leg.hasElevationData ? String(leg.elevationGain) : "-"}
              unit={leg.hasElevationData ? "m" : undefined}
            />
            <StatBlock label="Tid" value={leg.estimatedHours.toFixed(1)} unit="t" />
          </div>
          {!leg.hasElevationData && (
            <span
              className="text-base text-text-muted leading-snug"
              style={{ fontFamily: "var(--font-handwriting)" }}
            >
              Høydedata mangler. Bruk kart for verifikasjon.
            </span>
          )}
        </div>
        <WeatherBlock weather={weather} date={date} />
      </div>
    </article>
  );
}

export function TripTimelineView({ timeline }: { timeline: TripTimeline }) {
  if (!timeline.days.length) {
    return (
      <div
        className="rounded-lg border-2 border-flame-pressed bg-bg p-md text-text-primary text-lg shadow-[4px_4px_0_var(--brand-flame-pressed)]"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        {randomQuip("timelineEmpty")}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-md">
      <TimelineSummary timeline={timeline} />
      <div className="flex flex-col gap-md">
        {timeline.days.map((d) => (
          <TimelineDayCard key={d.dayNumber} day={d} />
        ))}
      </div>
      <div className="flex flex-col gap-xs text-small text-text-muted">
        {timeline.weatherUpdatedAt && (
          <p>
            Værdata fra MET Norway, oppdatert{" "}
            {new Date(timeline.weatherUpdatedAt).toLocaleString("no-NB")}.
          </p>
        )}
        <p>
          Tider og stigning er anslag (Naismith + Kartverket høydedata). Tilpass
          for vær, gruppe og dagsform.
        </p>
      </div>
    </div>
  );
}
