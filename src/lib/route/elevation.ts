const HOYDEDATA_URL = "https://ws.geonorge.no/hoydedata/v1/punkt";
const USER_AGENT = "PaTurMedMonsen/1.0 (lag7@blank.no)";

export type ElevationFetchOptions = {
  signal?: AbortSignal;
  revalidate?: number;
};

export async function fetchElevation(
  lat: number,
  lon: number,
  opts: ElevationFetchOptions = {},
): Promise<number | null> {
  const url = `${HOYDEDATA_URL}?koordsys=4258&nord=${lat.toFixed(5)}&ost=${lon.toFixed(5)}&geojson=false`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: opts.signal,
      next: { revalidate: opts.revalidate ?? 86400 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      punkter?: Array<{ z?: number | null }>;
    };
    const z = json.punkter?.[0]?.z;
    return typeof z === "number" ? z : null;
  } catch {
    return null;
  }
}

export async function fetchElevationProfile(
  points: Array<{ lat: number; lon: number }>,
  opts: ElevationFetchOptions = {},
): Promise<Array<number | null>> {
  return Promise.all(points.map((p) => fetchElevation(p.lat, p.lon, opts)));
}

export function elevationDeltas(profile: Array<number | null>): {
  gain: number;
  loss: number;
  min: number | null;
  max: number | null;
} {
  let gain = 0;
  let loss = 0;
  let min: number | null = null;
  let max: number | null = null;
  let prev: number | null = null;
  for (const z of profile) {
    if (z === null) continue;
    min = min === null ? z : Math.min(min, z);
    max = max === null ? z : Math.max(max, z);
    if (prev !== null) {
      const d = z - prev;
      if (d > 0) gain += d;
      else loss += -d;
    }
    prev = z;
  }
  return { gain: Math.round(gain), loss: Math.round(loss), min, max };
}
