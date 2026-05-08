import { utQuery, type UtFetchOptions } from "./client";

export type CabinAvailabilityStatus = "ledig" | "fullt" | "ukjent";

export interface CabinAvailabilityInfo {
  utId: number;
  name: string;
  status: CabinAvailabilityStatus;
  reason: string;
  bookingUrl: string | null;
  serviceLevel: string | null;
  beds: {
    staffed: number;
    selfService: number;
    noService: number;
    total: number;
  };
  dntCabin: boolean;
  bookingOnly: boolean;
}

export interface CabinAvailabilityResult extends CabinAvailabilityInfo {
  alternatives: CabinAvailabilityInfo[];
}

const CABIN_AVAILABILITY_QUERY = /* GraphQL */ `
  query CabinAvailability($id: Int!) {
    cabin(id: $id) {
      id
      name
      dntCabin
      serviceLevel
      bedsStaffed
      bedsSelfService
      bedsNoService
      bookingEnabled
      bookingOnly
      bookingUrl
      geojson
    }
  }
`;

const CABINS_NEAR_QUERY = /* GraphQL */ `
  query CabinsNear($input: FindNearInput!) {
    cabinsNear(input: $input) {
      distance
      cabin {
        id
        name
        dntCabin
        serviceLevel
        bedsStaffed
        bedsSelfService
        bedsNoService
        bookingEnabled
        bookingOnly
        bookingUrl
        geojson
      }
    }
  }
`;

interface RawCabin {
  id: number;
  name: string;
  dntCabin: boolean | null;
  serviceLevel: string | null;
  bedsStaffed: number | null;
  bedsSelfService: number | null;
  bedsNoService: number | null;
  bookingEnabled: boolean | null;
  bookingOnly: boolean | null;
  bookingUrl: string | null;
  geojson: { type: "Point"; coordinates: number[] } | null;
}

function totalBeds(c: RawCabin): number {
  return (
    (c.bedsStaffed ?? 0) +
    (c.bedsSelfService ?? 0) +
    (c.bedsNoService ?? 0)
  );
}

export function assessAvailability(
  cabin: RawCabin,
  persons: number,
): CabinAvailabilityInfo {
  const beds = {
    staffed: cabin.bedsStaffed ?? 0,
    selfService: cabin.bedsSelfService ?? 0,
    noService: cabin.bedsNoService ?? 0,
    total: totalBeds(cabin),
  };

  const base = {
    utId: cabin.id,
    name: cabin.name,
    bookingUrl: cabin.bookingUrl,
    serviceLevel: cabin.serviceLevel,
    beds,
    dntCabin: cabin.dntCabin === true,
    bookingOnly: cabin.bookingOnly === true,
  };

  if (cabin.bookingOnly) {
    return {
      ...base,
      status: "ukjent",
      reason: "Krever forhåndsbestilling. Sjekk hos tilbyder før dere drar.",
    };
  }

  if (cabin.dntCabin !== true) {
    return {
      ...base,
      status: "ukjent",
      reason: "Ikke en DNT-hytte. Kontakt eier for tilgjengelighet.",
    };
  }

  if (persons > 0 && beds.total > 0 && persons > beds.total) {
    return {
      ...base,
      status: "fullt",
      reason: `Hytta har bare ${beds.total} senger - ${persons} personer får ikke plass.`,
    };
  }

  if (cabin.serviceLevel === "STAFFED") {
    return {
      ...base,
      status: "ukjent",
      reason: "Betjent hytte. Bestill plass direkte hos DNT.",
    };
  }

  if (beds.selfService > 0 || beds.noService > 0) {
    return {
      ...base,
      status: "ledig",
      reason:
        "Selvbetjent eller ubetjent DNT-hytte. Som medlem er du garantert plass, men sengene er førstemann til mølla.",
    };
  }

  return {
    ...base,
    status: "ukjent",
    reason: "Mangler sengedata. Sjekk hos DNT før dere drar.",
  };
}

export async function getCabinAvailability(
  utId: number,
  persons: number,
  opts: UtFetchOptions = {},
): Promise<CabinAvailabilityInfo | null> {
  const data = await utQuery<{ cabin: RawCabin | null }>(
    CABIN_AVAILABILITY_QUERY,
    { id: utId },
    { revalidate: 3600, ...opts },
  );
  if (!data.cabin) return null;
  return assessAvailability(data.cabin, persons);
}

export async function findAlternatives(
  lat: number,
  lon: number,
  persons: number,
  opts: {
    excludeIds?: number[];
    maxDistanceMeters?: number;
    limit?: number;
    fetchOptions?: UtFetchOptions;
  } = {},
): Promise<CabinAvailabilityInfo[]> {
  const max = opts.maxDistanceMeters ?? 25000;
  const limit = opts.limit ?? 4;
  const exclude = new Set(opts.excludeIds ?? []);

  const data = await utQuery<{
    cabinsNear: Array<{ distance: number; cabin: RawCabin }>;
  }>(
    CABINS_NEAR_QUERY,
    { input: { coordinates: [lon, lat], maxDistance: max } },
    { revalidate: 3600, ...(opts.fetchOptions ?? {}) },
  );

  const out: CabinAvailabilityInfo[] = [];
  for (const entry of data.cabinsNear) {
    const c = entry.cabin;
    if (exclude.has(c.id)) continue;
    if (c.dntCabin !== true) continue;
    const info = assessAvailability(c, persons);
    if (info.status === "fullt") continue;
    out.push(info);
    if (out.length >= limit) break;
  }
  return out;
}
