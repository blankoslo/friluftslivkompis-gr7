import { recordApiError } from "@/lib/api-monitor";
import type { MetFetchOptions } from "./client";

const NOWCAST_URL = "https://api.met.no/weatherapi/nowcast/2.0/complete";
const USER_AGENT = "Friluftskompis/1.0 (lag7@blank.no)";

export type MetNowcastEntry = {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature?: number;
        precipitation_rate?: number;
        wind_speed?: number;
        wind_speed_of_gust?: number;
        wind_from_direction?: number;
        relative_humidity?: number;
      };
    };
    next_1_hours?: {
      summary?: { symbol_code?: string };
      details?: { precipitation_amount?: number };
    };
  };
};

export type MetNowcast = {
  updatedAt: string;
  units: Record<string, string>;
  timeseries: MetNowcastEntry[];
};

export class MetNowcastUnavailableError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "MetNowcastUnavailableError";
  }
}

export async function fetchNowcast(
  lat: number,
  lon: number,
  opts: MetFetchOptions = {},
): Promise<MetNowcast> {
  const url = `${NOWCAST_URL}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    signal: opts.signal,
    next: opts.revalidate ? { revalidate: opts.revalidate } : { revalidate: 180 },
  });

  if (res.status === 422) {
    throw new MetNowcastUnavailableError(
      "Nowcast er kun tilgjengelig i Norden",
      422,
    );
  }

  if (!res.ok) {
    const detail = await res.text();
    void recordApiError({
      provider: "met",
      status: res.status,
      message: detail,
      endpoint: NOWCAST_URL,
    });
    throw new MetNowcastUnavailableError(
      `met.no nowcast ${res.status}: ${detail}`,
      res.status,
    );
  }

  const json = (await res.json()) as {
    properties: {
      meta: { updated_at: string; units: Record<string, string> };
      timeseries: MetNowcastEntry[];
    };
  };

  return {
    updatedAt: json.properties.meta.updated_at,
    units: json.properties.meta.units,
    timeseries: json.properties.timeseries,
  };
}

export type NowcastSnapshot = {
  time: string;
  tempC: number | null;
  precipMmHr: number | null;
  windMs: number | null;
  windGustMs: number | null;
  windDirDeg: number | null;
  symbolCode: string | null;
};

export function pickCurrentNowcast(now: MetNowcast): NowcastSnapshot | null {
  const first = now.timeseries[0];
  if (!first) return null;
  const d = first.data.instant.details;
  const symbol = first.data.next_1_hours?.summary?.symbol_code ?? null;
  return {
    time: first.time,
    tempC: typeof d.air_temperature === "number" ? d.air_temperature : null,
    precipMmHr:
      typeof d.precipitation_rate === "number" ? d.precipitation_rate : null,
    windMs: typeof d.wind_speed === "number" ? d.wind_speed : null,
    windGustMs:
      typeof d.wind_speed_of_gust === "number" ? d.wind_speed_of_gust : null,
    windDirDeg:
      typeof d.wind_from_direction === "number" ? d.wind_from_direction : null,
    symbolCode: symbol,
  };
}
