import { recordApiError } from "@/lib/api-monitor";

const FORECAST_URL =
  "https://api.met.no/weatherapi/locationforecast/2.0/complete";
const USER_AGENT = "Friluftskompis/1.0 (lag7@blank.no)";

export type MetTimeseriesEntry = {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature?: number;
        wind_speed?: number;
        wind_from_direction?: number;
        relative_humidity?: number;
        cloud_area_fraction?: number;
      };
    };
    next_1_hours?: {
      summary?: { symbol_code?: string };
      details?: { precipitation_amount?: number };
    };
    next_6_hours?: {
      summary?: { symbol_code?: string };
      details?: {
        precipitation_amount?: number;
        air_temperature_min?: number;
        air_temperature_max?: number;
      };
    };
    next_12_hours?: {
      summary?: { symbol_code?: string };
    };
  };
};

export type MetForecast = {
  updatedAt: string;
  units: Record<string, string>;
  timeseries: MetTimeseriesEntry[];
};

export class MetApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "MetApiError";
  }
}

export type MetFetchOptions = {
  signal?: AbortSignal;
  revalidate?: number;
};

export async function fetchLocationForecast(
  lat: number,
  lon: number,
  opts: MetFetchOptions = {},
): Promise<MetForecast> {
  const url = `${FORECAST_URL}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    signal: opts.signal,
    next: opts.revalidate ? { revalidate: opts.revalidate } : { revalidate: 1800 },
  });

  if (!res.ok) {
    const detail = await res.text();
    void recordApiError({
      provider: "met",
      status: res.status,
      message: detail,
      endpoint: FORECAST_URL,
    });
    throw new MetApiError(`met.no ${res.status}: ${detail}`, res.status);
  }

  const json = (await res.json()) as {
    properties: {
      meta: { updated_at: string; units: Record<string, string> };
      timeseries: MetTimeseriesEntry[];
    };
  };

  return {
    updatedAt: json.properties.meta.updated_at,
    units: json.properties.meta.units,
    timeseries: json.properties.timeseries,
  };
}
