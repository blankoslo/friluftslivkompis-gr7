import type { TripTimeline } from "@/lib/timeline";
import type { RouteLeg } from "@/lib/route";
import type { DailyWeather } from "@/lib/met";
import { WeatherSymbol, weatherLabel } from "./weather-symbol";
import { cn } from "@/lib/utils";

const DIFFICULTY_LABEL: Record<RouteLeg["difficulty"], string> = {
  easy: "Lett",
  moderate: "Middels",
  tough: "Krevende",
};

const DIFFICULTY_STYLES: Record<RouteLeg["difficulty"], string> = {
  easy: "bg-forest-tint text-forest",
  moderate: "bg-fjord-tint text-fjord",
  tough: "bg-warning-bg text-warning border border-warning-border",
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
      <span className="text-small uppercase tracking-label text-text-muted">
        {label}
      </span>
      <span className="font-heading text-h3 text-text-primary">
        {value}
        {unit ? <span className="text-text-muted text-body ml-1">{unit}</span> : null}
      </span>
    </div>
  );
}

export function TimelineSummary({ timeline }: { timeline: TripTimeline }) {
  const { totals, days } = timeline;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-md p-md rounded-md border border-border bg-surface">
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
      <div className="flex items-center gap-sm text-text-muted text-small">
        Værvarsel mangler
      </div>
    );
  }
  return (
    <div className="flex items-start gap-md">
      <WeatherSymbol code={weather.symbolCode} />
      <div className="flex flex-col gap-xs flex-1">
        <span className="text-body text-text-primary">
          {weatherLabel(weather.symbolCode)}
        </span>
        <div className="flex flex-wrap gap-md text-small text-text-muted">
          {weather.tempMin !== null && weather.tempMax !== null && (
            <span>
              {Math.round(weather.tempMin)}°–{Math.round(weather.tempMax)}°C
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
              "inline-flex w-fit text-small px-sm py-xs rounded-pill",
              weather.reliability === "low"
                ? "bg-warning-bg text-warning"
                : "bg-fjord-tint text-fjord",
            )}
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
    <article className="rounded-md border border-border bg-surface overflow-hidden">
      <header className="flex items-center justify-between gap-md px-md py-sm border-b border-border bg-bg">
        <div className="flex items-center gap-md">
          <span className="font-heading text-h3 text-flame">Dag {dayNumber}</span>
          {date && (
            <span className="text-small text-text-muted capitalize">
              {formatDate(date)}
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-small px-sm py-xs rounded-pill",
            DIFFICULTY_STYLES[leg.difficulty],
          )}
        >
          {DIFFICULTY_LABEL[leg.difficulty]}
        </span>
      </header>
      <div className="grid md:grid-cols-2 gap-md p-md">
        <div className="flex flex-col gap-sm">
          <div className="flex items-baseline gap-sm">
            <span className="font-heading text-body text-text-primary">
              {leg.from.name}
            </span>
            <span className="text-text-muted">→</span>
            <span className="font-heading text-body text-text-primary">
              {leg.to.name}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-sm">
            <StatBlock label="Distanse" value={leg.distanceKm.toFixed(1)} unit="km" />
            <StatBlock
              label="Stigning"
              value={leg.hasElevationData ? String(leg.elevationGain) : "—"}
              unit={leg.hasElevationData ? "m" : undefined}
            />
            <StatBlock label="Tid" value={leg.estimatedHours.toFixed(1)} unit="t" />
          </div>
          {!leg.hasElevationData && (
            <span className="text-small text-text-muted">
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
      <div className="rounded-md border border-border bg-surface p-md text-text-muted">
        Legg til minst to hytter for å bygge tidslinje.
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
