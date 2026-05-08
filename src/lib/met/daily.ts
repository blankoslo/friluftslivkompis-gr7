import type { MetForecast, MetTimeseriesEntry } from "./client";

export type DailyWeather = {
  date: string;
  tempMin: number | null;
  tempMax: number | null;
  precipMm: number;
  windMaxMs: number | null;
  windAvgMs: number | null;
  symbolCode: string | null;
  reliability: "high" | "medium" | "low";
  hours: number;
};

const HIGH_DAYS = 2;
const MEDIUM_DAYS = 9;

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function pickSymbol(entries: MetTimeseriesEntry[]): string | null {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const code =
      e.data.next_6_hours?.summary?.symbol_code ??
      e.data.next_1_hours?.summary?.symbol_code ??
      e.data.next_12_hours?.summary?.symbol_code ??
      null;
    if (!code) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const noonish = entries.find((e) => {
    const h = Number(e.time.slice(11, 13));
    return h >= 11 && h <= 14;
  });
  const noonCode =
    noonish?.data.next_6_hours?.summary?.symbol_code ??
    noonish?.data.next_1_hours?.summary?.symbol_code ??
    null;
  if (noonCode) return noonCode;
  let best: string | null = null;
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function reliabilityFor(date: string, today: string): DailyWeather["reliability"] {
  const d = new Date(date + "T00:00:00Z").getTime();
  const t = new Date(today + "T00:00:00Z").getTime();
  const days = Math.round((d - t) / (24 * 3600 * 1000));
  if (days <= HIGH_DAYS) return "high";
  if (days <= MEDIUM_DAYS) return "medium";
  return "low";
}

export function aggregateDaily(
  forecast: MetForecast,
  startDate: string,
  endDate: string,
): DailyWeather[] {
  const buckets = new Map<string, MetTimeseriesEntry[]>();
  for (const entry of forecast.timeseries) {
    const key = dateKey(entry.time);
    if (key < startDate || key > endDate) continue;
    const arr = buckets.get(key);
    if (arr) arr.push(entry);
    else buckets.set(key, [entry]);
  }

  const today = new Date().toISOString().slice(0, 10);
  const out: DailyWeather[] = [];
  const sorted = [...buckets.keys()].sort();
  for (const date of sorted) {
    const entries = buckets.get(date)!;
    let tMin: number | null = null;
    let tMax: number | null = null;
    let precip = 0;
    let windMax: number | null = null;
    let windSum = 0;
    let windN = 0;
    for (const e of entries) {
      const t = e.data.instant.details.air_temperature;
      const w = e.data.instant.details.wind_speed;
      const p1 = e.data.next_1_hours?.details?.precipitation_amount;
      const p6 = e.data.next_6_hours?.details?.precipitation_amount;
      if (typeof t === "number") {
        tMin = tMin === null ? t : Math.min(tMin, t);
        tMax = tMax === null ? t : Math.max(tMax, t);
      }
      if (typeof w === "number") {
        windMax = windMax === null ? w : Math.max(windMax, w);
        windSum += w;
        windN++;
      }
      if (typeof p1 === "number") precip += p1;
      else if (typeof p6 === "number") {
        const h = Number(e.time.slice(11, 13));
        if (h % 6 === 0) precip += p6;
      }
    }
    out.push({
      date,
      tempMin: tMin,
      tempMax: tMax,
      precipMm: Math.round(precip * 10) / 10,
      windMaxMs: windMax,
      windAvgMs: windN ? Math.round((windSum / windN) * 10) / 10 : null,
      symbolCode: pickSymbol(entries),
      reliability: reliabilityFor(date, today),
      hours: entries.length,
    });
  }
  return out;
}
