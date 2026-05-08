import { haversineKm, interpolatePoints, naismithHours } from "./geo";
import { fetchElevationProfile, elevationDeltas } from "./elevation";

export type CabinPoint = {
  id?: number;
  utId?: number;
  name: string;
  lat: number;
  lon: number;
};

export type RouteLeg = {
  dayNumber: number;
  from: CabinPoint;
  to: CabinPoint;
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  elevationMin: number | null;
  elevationMax: number | null;
  estimatedHours: number;
  difficulty: "easy" | "moderate" | "tough";
  hasElevationData: boolean;
};

export type ComputeLegsOptions = {
  signal?: AbortSignal;
  samplesPerLeg?: number;
  skipElevation?: boolean;
};

const DEFAULT_SAMPLES = 8;

function difficultyFor(distanceKm: number, elevationGain: number): RouteLeg["difficulty"] {
  if (elevationGain >= 1000 || distanceKm >= 25) return "tough";
  if (elevationGain >= 500 || distanceKm >= 15) return "moderate";
  return "easy";
}

export async function computeLegs(
  cabins: CabinPoint[],
  opts: ComputeLegsOptions = {},
): Promise<RouteLeg[]> {
  if (cabins.length < 2) return [];
  const samples = opts.samplesPerLeg ?? DEFAULT_SAMPLES;
  const legs: RouteLeg[] = [];

  for (let i = 0; i < cabins.length - 1; i++) {
    const from = cabins[i];
    const to = cabins[i + 1];
    const distanceKm = haversineKm(from, to);

    let gain = 0;
    let loss = 0;
    let min: number | null = null;
    let max: number | null = null;
    let hasElev = false;

    if (!opts.skipElevation) {
      const points = interpolatePoints(from, to, samples);
      const profile = await fetchElevationProfile(points, { signal: opts.signal });
      const valid = profile.filter((z) => z !== null).length;
      if (valid >= 2) {
        const deltas = elevationDeltas(profile);
        gain = deltas.gain;
        loss = deltas.loss;
        min = deltas.min;
        max = deltas.max;
        hasElev = true;
      }
    }

    const estimatedHours = naismithHours(distanceKm, gain);
    legs.push({
      dayNumber: i + 1,
      from,
      to,
      distanceKm: Math.round(distanceKm * 10) / 10,
      elevationGain: gain,
      elevationLoss: loss,
      elevationMin: min,
      elevationMax: max,
      estimatedHours: Math.round(estimatedHours * 10) / 10,
      difficulty: difficultyFor(distanceKm, gain),
      hasElevationData: hasElev,
    });
  }

  return legs;
}
