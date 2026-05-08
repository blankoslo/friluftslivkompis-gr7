import { utQuery, type UtFetchOptions } from "./client";
import { getTrip, getCabin } from "./hydrate";

export interface AutoCabinPick {
  utId: number;
  name: string;
  lat: number;
  lon: number;
}

const CABINS_NEAR_QUERY = /* GraphQL */ `
  query AutoCabinsNear($input: FindNearInput!) {
    cabinsNear(input: $input) {
      distance
      cabin {
        id
        name
        dntCabin
        geojson
      }
    }
  }
`;

interface NearRow {
  distance: number;
  cabin: {
    id: number;
    name: string;
    dntCabin: boolean | null;
    geojson: { type: "Point"; coordinates: number[] } | null;
  };
}

export async function pickCabinsNear(
  lat: number,
  lon: number,
  opts: {
    count?: number;
    maxDistanceMeters?: number;
    fetchOptions?: UtFetchOptions;
  } = {},
): Promise<AutoCabinPick[]> {
  const count = opts.count ?? 3;
  const max = opts.maxDistanceMeters ?? 60_000;

  const data = await utQuery<{ cabinsNear: NearRow[] }>(
    CABINS_NEAR_QUERY,
    { input: { coordinates: [lon, lat], maxDistance: max } },
    { revalidate: 3600, ...(opts.fetchOptions ?? {}) },
  );

  const out: AutoCabinPick[] = [];
  for (const row of data.cabinsNear) {
    const c = row.cabin;
    if (c.dntCabin !== true) continue;
    const coords = c.geojson?.coordinates;
    if (!coords || coords.length < 2) continue;
    out.push({
      utId: c.id,
      name: c.name,
      lon: coords[0],
      lat: coords[1],
    });
    if (out.length >= count) break;
  }
  return out;
}

export async function pickCabinsFromUtTrip(
  utTripId: number,
  opts: { fetchOptions?: UtFetchOptions } = {},
): Promise<AutoCabinPick[]> {
  const trip = await getTrip(utTripId, opts.fetchOptions ?? {});
  if (!trip || trip.cabinIds.length === 0) return [];

  const cabins = await Promise.all(
    trip.cabinIds.map((id) => getCabin(id, opts.fetchOptions ?? {})),
  );

  const out: AutoCabinPick[] = [];
  for (const c of cabins) {
    if (!c) continue;
    const coords = c.geojson?.coordinates;
    if (!coords || coords.length < 2) continue;
    out.push({
      utId: c.id,
      name: c.name,
      lon: coords[0],
      lat: coords[1],
    });
  }
  return out;
}
