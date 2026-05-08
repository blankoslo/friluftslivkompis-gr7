import { haversineKm } from "@/lib/route/geo";

export interface TripLegLite {
  dayNumber: number;
  fromHut: string;
  toHut: string;
  distanceKm: number;
  elevationGain: number;
  estimatedHours?: number;
}

export interface TripCabinLite {
  name: string;
  lat: number;
  lon: number;
}

export interface TripStats {
  distanceKm: number;
  elevationGain: number;
  totalHours: number;
  legCount: number;
  durationDays: number | null;
  cabinCount: number;
  source: "legs" | "cabins" | "empty";
}

export interface ProfilePoint {
  km: number;
  elevation: number;
  cabin: string;
}

export function computeTripStats(
  legs: TripLegLite[] | undefined,
  cabins: TripCabinLite[] | undefined,
  startDate?: Date | string | null,
  endDate?: Date | string | null,
): TripStats {
  const cabinCount = cabins?.length ?? 0;
  const durationDays = computeDurationDays(startDate, endDate);

  if (legs && legs.length > 0) {
    let distanceKm = 0;
    let elevationGain = 0;
    let totalHours = 0;
    for (const l of legs) {
      distanceKm += l.distanceKm || 0;
      elevationGain += l.elevationGain || 0;
      totalHours += l.estimatedHours || 0;
    }
    return {
      distanceKm: round(distanceKm, 1),
      elevationGain: Math.round(elevationGain),
      totalHours: round(totalHours, 1),
      legCount: legs.length,
      durationDays,
      cabinCount,
      source: "legs",
    };
  }

  if (cabins && cabins.length >= 2) {
    let distanceKm = 0;
    for (let i = 1; i < cabins.length; i++) {
      distanceKm += haversineKm(
        { lat: cabins[i - 1].lat, lon: cabins[i - 1].lon },
        { lat: cabins[i].lat, lon: cabins[i].lon },
      );
    }
    return {
      distanceKm: round(distanceKm, 1),
      elevationGain: 0,
      totalHours: 0,
      legCount: cabins.length - 1,
      durationDays,
      cabinCount,
      source: "cabins",
    };
  }

  return {
    distanceKm: 0,
    elevationGain: 0,
    totalHours: 0,
    legCount: 0,
    durationDays,
    cabinCount,
    source: "empty",
  };
}

export function computeProfilePoints(
  legs: TripLegLite[] | undefined,
  cabins: TripCabinLite[] | undefined,
): ProfilePoint[] {
  if (!legs || legs.length === 0) return [];
  const startName = cabins?.[0]?.name ?? legs[0].fromHut;
  const points: ProfilePoint[] = [{ km: 0, elevation: 0, cabin: startName }];
  let cumKm = 0;
  let cumGain = 0;
  for (const leg of legs) {
    cumKm += leg.distanceKm || 0;
    cumGain += leg.elevationGain || 0;
    points.push({
      km: round(cumKm, 2),
      elevation: Math.round(cumGain),
      cabin: leg.toHut,
    });
  }
  return points;
}

function computeDurationDays(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
): number | null {
  if (!startDate || !endDate) return null;
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  return diff > 0 ? diff : null;
}

function round(n: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export interface AggregatedStats {
  trips: number;
  distanceKm: number;
  elevationGain: number;
  totalHours: number;
  totalDays: number;
  bySeason: Record<string, { trips: number; distanceKm: number; elevationGain: number }>;
}

export function aggregateStats(stats: Array<TripStats & { startDate?: string | null }>): AggregatedStats {
  let distanceKm = 0;
  let elevationGain = 0;
  let totalHours = 0;
  let totalDays = 0;
  const bySeason: AggregatedStats["bySeason"] = {};
  for (const s of stats) {
    distanceKm += s.distanceKm;
    elevationGain += s.elevationGain;
    totalHours += s.totalHours;
    totalDays += s.durationDays ?? 0;
    const season = seasonOf(s.startDate);
    if (!bySeason[season]) {
      bySeason[season] = { trips: 0, distanceKm: 0, elevationGain: 0 };
    }
    bySeason[season].trips += 1;
    bySeason[season].distanceKm = round(
      bySeason[season].distanceKm + s.distanceKm,
      1,
    );
    bySeason[season].elevationGain = Math.round(
      bySeason[season].elevationGain + s.elevationGain,
    );
  }
  return {
    trips: stats.length,
    distanceKm: round(distanceKm, 1),
    elevationGain: Math.round(elevationGain),
    totalHours: round(totalHours, 1),
    totalDays,
    bySeason,
  };
}

function seasonOf(iso?: string | null): string {
  if (!iso) return "Ukjent";
  const month = new Date(iso).getUTCMonth();
  if (month >= 2 && month <= 4) return "Vår";
  if (month >= 5 && month <= 7) return "Sommer";
  if (month >= 8 && month <= 9) return "Høst";
  return "Vinter";
}
