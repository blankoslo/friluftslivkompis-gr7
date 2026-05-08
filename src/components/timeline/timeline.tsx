import type { TripTimeline } from "@/lib/timeline";
import type { RouteLeg } from "@/lib/route";
import type { DailyWeather } from "@/lib/met";
import { WeatherSymbol, weatherLabel } from "./weather-symbol";
import { cn } from "@/lib/utils";
import { randomQuip } from "@/lib/lars-monsen/quips";

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

function WeatherBlock({ weather }: { weather: DailyWeather | null }) {
  if (!weather) {
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
        <WeatherBlock weather={weather} />
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
      {timeline.weatherUpdatedAt && (
        <p className="text-small text-text-muted">
          Værdata fra MET Norway, oppdatert{" "}
          {new Date(timeline.weatherUpdatedAt).toLocaleString("no-NB")}.
        </p>
      )}
    </div>
  );
}
