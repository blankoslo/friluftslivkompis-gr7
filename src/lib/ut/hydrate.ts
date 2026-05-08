import { utQuery, type UtFetchOptions } from "./client";

export type GeoJSONPoint = {
  type: "Point";
  coordinates: [number, number] | [number, number, number];
};

export type GeoJSONLineString = {
  type: "LineString";
  coordinates: Array<[number, number] | [number, number, number]>;
};

export type GeoJSONGeometry =
  | GeoJSONPoint
  | GeoJSONLineString
  | { type: string; coordinates: unknown };

export type Cabin = {
  id: number;
  name: string;
  geojson: GeoJSONPoint | null;
  serviceLevel: string | null;
  dntCabin: boolean;
  bedsStaffed: number | null;
  bedsSelfService: number | null;
  bedsNoService: number | null;
  bedsExtra: number | null;
  bedsWinter: number | null;
  description: string | null;
  phone: string | null;
  email: string | null;
};

export type Trip = {
  id: number;
  name: string;
  distance: number | null;
  grading: string | null;
  primaryActivityType: string | null;
  durationDays: number | null;
  durationHours: number | null;
  durationMinutes: number | null;
  elevationGain: number | null;
  elevationLoss: number | null;
  elevationMax: number | null;
  elevationMin: number | null;
  startPointGeojson: GeoJSONPoint | null;
  geojson: GeoJSONGeometry | null;
  encodedPolyline: string | null;
  cabinIds: number[];
  poiIds: number[];
  areaIds: number[];
};

export type Area = {
  id: number;
  name: string;
  areaType: string | null;
  subType: string | null;
  centerPointGeojson: GeoJSONPoint | null;
  geojson: GeoJSONGeometry | null;
};

export type Poi = {
  id: number;
  name: string;
  primaryTypeName: string | null;
  geojson: GeoJSONPoint | null;
  elevationCustom: number | null;
};

const CABIN_QUERY = /* GraphQL */ `
  query Cabin($id: Int!) {
    cabin(id: $id) {
      id name geojson serviceLevel dntCabin
      bedsStaffed bedsSelfService bedsNoService bedsExtra bedsWinter
      description phone email
    }
  }
`;

const TRIP_QUERY = /* GraphQL */ `
  query Trip($id: Int!) {
    trip(id: $id) {
      id name distance grading primaryActivityType
      durationDays durationHours durationMinutes
      elevationGain elevationLoss elevationMax elevationMin
      startPointGeojson geojson encodedPolyline
      cabinIds poiIds areaIds
    }
  }
`;

const AREA_QUERY = /* GraphQL */ `
  query Area($id: Int!) {
    area(id: $id) {
      id name areaType subType centerPointGeojson geojson
    }
  }
`;

const POI_QUERY = /* GraphQL */ `
  query Poi($id: Int!) {
    poi(id: $id) {
      id name primaryTypeName geojson elevationCustom
    }
  }
`;

export async function getCabin(id: number, opts: UtFetchOptions = {}) {
  const data = await utQuery<{ cabin: Cabin | null }>(
    CABIN_QUERY,
    { id },
    { revalidate: 86400, ...opts },
  );
  return data.cabin;
}

export async function getTrip(id: number, opts: UtFetchOptions = {}) {
  const data = await utQuery<{ trip: Trip | null }>(
    TRIP_QUERY,
    { id },
    { revalidate: 86400, ...opts },
  );
  return data.trip;
}

export async function getArea(id: number, opts: UtFetchOptions = {}) {
  const data = await utQuery<{ area: Area | null }>(
    AREA_QUERY,
    { id },
    { revalidate: 86400, ...opts },
  );
  return data.area;
}

export async function getPoi(id: number, opts: UtFetchOptions = {}) {
  const data = await utQuery<{ poi: Poi | null }>(
    POI_QUERY,
    { id },
    { revalidate: 86400, ...opts },
  );
  return data.poi;
}
