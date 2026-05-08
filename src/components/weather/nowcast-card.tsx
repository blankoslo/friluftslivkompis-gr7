"use client";

import { useEffect, useState } from "react";
import { WeatherSymbol, weatherLabel } from "@/components/timeline/weather-symbol";
import { MonsenLine } from "@/components/lars-monsen/monsen-line";
import { StaleBadge } from "@/components/ui/stale-badge";

const TEMP_DEVIATION_C = 4;
const PRECIP_SURPRISE_MM_HR = 0.5;
const WIND_DEVIATION_MS = 5;
const NOWCAST_HORIZON_MS = 2 * 60 * 60 * 1000;

type NowcastResponse = {
  time?: string;
  tempC?: number | null;
  precipMmHr?: number | null;
  windMs?: number | null;
  windGustMs?: number | null;
  windDirDeg?: number | null;
  symbolCode?: string | null;
  updatedAt?: string;
  stale?: boolean;
  snapshotAt?: string | null;
};

type ForecastDay = {
  date: string;
  tempMin: number | null;
  tempMax: number | null;
  precipMm: number;
  windMaxMs: number | null;
  windAvgMs: number | null;
  symbolCode: string | null;
};

type ForecastResponse = {
  updatedAt?: string;
  daily?: ForecastDay[];
};

type Props = {
  lat: number;
  lon: number;
  startName?: string;
};

type LoadedNowcast = {
  now: NowcastResponse;
  todayForecast: ForecastDay | null;
  fetchedAtMs: number;
};

function compassFromDeg(deg: number | null | undefined): string {
  if (deg === null || deg === undefined) return "";
  const dirs = ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"];
  const idx = Math.round((deg % 360) / 45) % 8;
  return dirs[idx];
}

function formatClock(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Deviation = {
  text: string;
  category: "weatherDanger" | "weatherSun" | "weatherCold";
};

function detectDeviation(
  now: NowcastResponse,
  todayForecast: ForecastDay | null,
): Deviation | null {
  if (!todayForecast) return null;

  const tempForecastMid =
    todayForecast.tempMin !== null && todayForecast.tempMax !== null
      ? (todayForecast.tempMin + todayForecast.tempMax) / 2
      : null;

  if (
    typeof now.tempC === "number" &&
    tempForecastMid !== null &&
    Math.abs(now.tempC - tempForecastMid) > TEMP_DEVIATION_C
  ) {
    const colder = now.tempC < tempForecastMid;
    return {
      text: colder
        ? `Kaldere enn varslet (${now.tempC.toFixed(0)}° vs ${tempForecastMid.toFixed(0)}°). Pakk et ekstra ullag før du går.`
        : `Varmere enn varslet (${now.tempC.toFixed(0)}° vs ${tempForecastMid.toFixed(0)}°). Drikk vann, ikke heroisk.`,
      category: colder ? "weatherCold" : "weatherSun",
    };
  }

  if (
    typeof now.precipMmHr === "number" &&
    now.precipMmHr > PRECIP_SURPRISE_MM_HR &&
    todayForecast.precipMm < 0.2
  ) {
    return {
      text: `Det bøtter ned akkurat nå (${now.precipMmHr.toFixed(1)} mm/t) selv om varselet var tørt. Vurder regntøyet høyere i sekken.`,
      category: "weatherDanger",
    };
  }

  if (
    typeof now.windMs === "number" &&
    todayForecast.windMaxMs !== null &&
    now.windMs - todayForecast.windMaxMs > WIND_DEVIATION_MS
  ) {
    return {
      text: `Vinden er sterkere enn varslet (${now.windMs.toFixed(0)} m/s). Vurder lavere rute eller utsett start.`,
      category: "weatherDanger",
    };
  }

  return null;
}

export function NowcastCard({ lat, lon, startName }: Props) {
  const [data, setData] = useState<LoadedNowcast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const today = new Date().toISOString().slice(0, 10);

    async function load() {
      setLoading(true);
      try {
        const [nowRes, fcRes] = await Promise.all([
          fetch(`/api/weather/nowcast?lat=${lat}&lon=${lon}`, {
            signal: controller.signal,
          }),
          fetch(`/api/weather?lat=${lat}&lon=${lon}&start=${today}&end=${today}`, {
            signal: controller.signal,
          }),
        ]);
        const nowJson = (await nowRes.json()) as NowcastResponse;
        const fcJson = fcRes.ok
          ? ((await fcRes.json()) as ForecastResponse)
          : null;
        if (cancelled) return;
        setData({
          now: nowJson,
          todayForecast: fcJson?.daily?.[0] ?? null,
          fetchedAtMs: Date.now(),
        });
        setError(null);
      } catch (err) {
        if (cancelled) return;
        if ((err as Error).name === "AbortError") return;
        setError("Kunne ikke hente sanntidsvær.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [lat, lon]);

  if (loading) {
    return (
      <div className="rounded-md border-2 border-flame-pressed bg-bg p-md shadow-[3px_3px_0_var(--brand-flame-pressed)]">
        <p
          className="text-text-muted text-base leading-snug"
          style={{ fontFamily: "var(--font-handwriting)" }}
        >
          Henter sanntidsvær fra Yr...
        </p>
      </div>
    );
  }

  if (error || !data || data.now.stale) {
    return (
      <div className="rounded-md border-2 border-warning-border bg-warning-bg p-md shadow-[3px_3px_0_var(--accent-warning)]">
        <div className="flex items-center justify-between gap-sm flex-wrap">
          <h3 className="font-heading font-bold text-h3 text-warning">
            Sanntidsvær utilgjengelig
          </h3>
          <StaleBadge snapshotAt={null} />
        </div>
        <p
          className="mt-sm text-text-primary text-base leading-snug"
          style={{ fontFamily: "var(--font-handwriting)" }}
        >
          {error ??
            "Yr ga oss ingen sanntidsmåling akkurat nå. Følg prognosen og se på himmelen."}
        </p>
      </div>
    );
  }

  const { now, todayForecast, fetchedAtMs } = data;
  const fresh = formatClock(now.time);
  const updated = formatClock(now.updatedAt);
  const obsMs = now.time ? new Date(now.time).getTime() : null;
  const isInsideHorizon =
    obsMs !== null && Math.abs(obsMs - fetchedAtMs) < NOWCAST_HORIZON_MS;
  const deviation = detectDeviation(now, todayForecast);

  const tempStr =
    typeof now.tempC === "number" ? `${now.tempC.toFixed(1)}°` : "–";
  const precipStr =
    typeof now.precipMmHr === "number"
      ? `${now.precipMmHr.toFixed(1)} mm/t`
      : "–";
  const windStr =
    typeof now.windMs === "number" ? `${now.windMs.toFixed(0)} m/s` : "–";
  const gustStr =
    typeof now.windGustMs === "number"
      ? ` (kast ${now.windGustMs.toFixed(0)})`
      : "";
  const compass = compassFromDeg(now.windDirDeg);

  return (
    <div className="rounded-md border-2 border-flame-pressed bg-flame-tint p-md shadow-[3px_3px_0_var(--brand-flame-pressed)] flex flex-col gap-md">
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div className="flex items-start gap-md">
          <WeatherSymbol code={now.symbolCode ?? null} className="text-4xl" />
          <div className="flex flex-col gap-xs">
            <h3 className="font-heading font-bold text-h3 text-text-primary">
              Akkurat nå{startName ? ` ved ${startName}` : ""}
            </h3>
            <p className="text-small text-text-muted">
              {weatherLabel(now.symbolCode ?? null)}
              {fresh ? ` · kl ${fresh}` : ""}
              {!isInsideHorizon ? " · utenfor 2t-horisont" : ""}
            </p>
          </div>
        </div>
        <span
          className="text-xs font-bold px-sm py-1 rounded-pill uppercase tracking-label bg-fjord text-white"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          NowCast
        </span>
      </div>

      <div className="grid grid-cols-3 gap-md">
        <Stat label="Temperatur" value={tempStr} />
        <Stat label="Nedbør" value={precipStr} />
        <Stat
          label="Vind"
          value={`${windStr}${gustStr}`}
          hint={compass || undefined}
        />
      </div>

      {deviation && (
        <MonsenLine
          category={deviation.category}
          quip={`Lars merker det: ${deviation.text}`}
          variant="card"
        />
      )}

      <p className="text-xs text-text-muted">
        Sanntidsdata fra MET Norway / Yr
        {updated ? `, oppdatert kl ${updated}` : ""}.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <span
        className="text-small uppercase tracking-label text-flame-pressed font-bold"
        style={{ fontFamily: "var(--font-stamp)" }}
      >
        {label}
      </span>
      <span className="font-heading text-h3 font-bold text-text-primary leading-tight">
        {value}
      </span>
      {hint && (
        <span className="text-xs text-text-muted leading-snug">{hint}</span>
      )}
    </div>
  );
}
