const USER_AGENT = "Friluftskompis/1.0 (lag7@blank.no)";

interface MetResponse {
  properties: {
    timeseries: Array<{
      time: string;
      data: {
        instant: { details: { air_temperature?: number; wind_speed?: number } };
        next_6_hours?: {
          summary?: { symbol_code?: string };
          details?: { precipitation_amount?: number };
        };
      };
    }>;
  };
}

export interface TripWeatherSummary {
  minTempC: number;
  maxTempC: number;
  totalPrecipMm: number;
  maxWindMs: number;
  dominantSymbol: string;
  daySummaries: Array<{
    date: string;
    minTempC: number;
    maxTempC: number;
    precipMm: number;
    symbol: string;
  }>;
}

export async function getTripWeather(
  lat: number,
  lon: number,
  startDate: Date,
  endDate: Date,
  opts: { signal?: AbortSignal } = {},
): Promise<TripWeatherSummary | null> {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: opts.signal,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error("[met] forecast failed", res.status);
    return null;
  }

  const data = (await res.json()) as MetResponse;
  const start = startDate.getTime();
  const end = endDate.getTime();

  const inRange = data.properties.timeseries.filter((entry) => {
    const t = new Date(entry.time).getTime();
    return t >= start && t <= end;
  });

  if (inRange.length === 0) return null;

  const byDay = new Map<
    string,
    { temps: number[]; precip: number; winds: number[]; symbols: string[] }
  >();

  let minTempC = Infinity;
  let maxTempC = -Infinity;
  let totalPrecipMm = 0;
  let maxWindMs = 0;
  const symbolCounts = new Map<string, number>();

  for (const entry of inRange) {
    const day = entry.time.slice(0, 10);
    const t = entry.data.instant.details.air_temperature;
    const w = entry.data.instant.details.wind_speed;
    const p = entry.data.next_6_hours?.details?.precipitation_amount ?? 0;
    const sym = entry.data.next_6_hours?.summary?.symbol_code ?? "";

    if (!byDay.has(day))
      byDay.set(day, { temps: [], precip: 0, winds: [], symbols: [] });
    const bucket = byDay.get(day)!;
    if (typeof t === "number") {
      bucket.temps.push(t);
      minTempC = Math.min(minTempC, t);
      maxTempC = Math.max(maxTempC, t);
    }
    if (typeof w === "number") {
      bucket.winds.push(w);
      maxWindMs = Math.max(maxWindMs, w);
    }
    bucket.precip += p;
    totalPrecipMm += p;
    if (sym) {
      bucket.symbols.push(sym);
      symbolCounts.set(sym, (symbolCounts.get(sym) ?? 0) + 1);
    }
  }

  const daySummaries = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({
      date,
      minTempC: b.temps.length ? Math.min(...b.temps) : 0,
      maxTempC: b.temps.length ? Math.max(...b.temps) : 0,
      precipMm: Math.round(b.precip * 10) / 10,
      symbol: dominant(b.symbols),
    }));

  let dominantSymbol = "";
  let bestCount = 0;
  for (const [sym, count] of symbolCounts) {
    if (count > bestCount) {
      bestCount = count;
      dominantSymbol = sym;
    }
  }

  return {
    minTempC: minTempC === Infinity ? 0 : Math.round(minTempC * 10) / 10,
    maxTempC: maxTempC === -Infinity ? 0 : Math.round(maxTempC * 10) / 10,
    totalPrecipMm: Math.round(totalPrecipMm * 10) / 10,
    maxWindMs: Math.round(maxWindMs * 10) / 10,
    dominantSymbol,
    daySummaries,
  };
}

function dominant(items: string[]): string {
  if (items.length === 0) return "";
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  let best = items[0];
  let bestCount = 0;
  for (const [k, v] of counts) {
    if (v > bestCount) {
      best = k;
      bestCount = v;
    }
  }
  return best;
}
