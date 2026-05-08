import { utQuery, type UtFetchOptions } from "./client";
import type { GeoJSONPoint } from "./hydrate";

export type TripActivityType =
  | "BERRY_PICKING"
  | "CLIMBING"
  | "CYCLING"
  | "GLACIER_TRIP"
  | "HIKING"
  | "PADLING"
  | "SKI_TOURING";

export type TripGrading = "EASY" | "MODERATE" | "TOUGH" | "VERY_TOUGH";

export type TripNearItem = {
  id: number;
  name: string;
  distance: number;
  primaryActivityType: TripActivityType | null;
  grading: TripGrading | null;
  durationDays: number | null;
  durationHours: number | null;
  durationMinutes: number | null;
  tripDistance: number | null;
  activityTypeIds: number[];
  accessibilityIds: number[];
  lat: number;
  lon: number;
};

const TRIPS_NEAR_QUERY = /* GraphQL */ `
  query TripsNear($coords: [Float!]!, $maxDistance: Int!) {
    tripsNear(input: { coordinates: $coords, maxDistance: $maxDistance }) {
      distance
      trip {
        id
        name
        primaryActivityType
        grading
        durationDays
        durationHours
        durationMinutes
        distance
        startPointGeojson
        activityTypes { id }
        accessibilityIds
      }
    }
  }
`;

type Response = {
  tripsNear: Array<{
    distance: number;
    trip: {
      id: number;
      name: string;
      primaryActivityType: TripActivityType | null;
      grading: TripGrading | null;
      durationDays: number | null;
      durationHours: number | null;
      durationMinutes: number | null;
      distance: number | null;
      startPointGeojson: GeoJSONPoint | null;
      activityTypes: Array<{ id: number }> | null;
      accessibilityIds: number[] | null;
    };
  }>;
};

export async function fetchTripsNear(
  lon: number,
  lat: number,
  maxDistanceMeters: number,
  opts: UtFetchOptions = {},
): Promise<TripNearItem[]> {
  const data = await utQuery<Response>(
    TRIPS_NEAR_QUERY,
    { coords: [lon, lat], maxDistance: maxDistanceMeters },
    { revalidate: 600, ...opts },
  );

  const items: TripNearItem[] = [];
  for (const entry of data.tripsNear) {
    const coords = entry.trip.startPointGeojson?.coordinates;
    if (!coords || coords.length < 2) continue;
    items.push({
      id: entry.trip.id,
      name: entry.trip.name,
      distance: entry.distance,
      primaryActivityType: entry.trip.primaryActivityType,
      grading: entry.trip.grading,
      durationDays: entry.trip.durationDays,
      durationHours: entry.trip.durationHours,
      durationMinutes: entry.trip.durationMinutes,
      tripDistance: entry.trip.distance,
      activityTypeIds: (entry.trip.activityTypes ?? []).map((a) => a.id),
      accessibilityIds: entry.trip.accessibilityIds ?? [],
      lon: coords[0],
      lat: coords[1],
    });
  }
  return items;
}
