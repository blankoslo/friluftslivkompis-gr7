import type { TripNearItem } from "@/lib/ut";

export type MinAgeBand = 4 | 7 | 10 | 13;

export type AgeFilter = MinAgeBand | null;

export const AGE_BAND_LABEL: Record<MinAgeBand, string> = {
  4: "4 år+",
  7: "7 år+",
  10: "10 år+",
  13: "13 år+",
};

export const AGE_BAND_HINT: Record<MinAgeBand, string> = {
  4: "Småbarn, trillevennlig",
  7: "Barn som går selv",
  10: "Friske barn med tursko",
  13: "Tenåringer",
};

export const AGE_BANDS: MinAgeBand[] = [4, 7, 10, 13];

const ACTIVITY_TYPE = {
  SKOGSTUR: 1,
  FISKETUR: 2,
  HYTTETUR: 3,
  BAERTUR: 4,
  TOPPTUR: 5,
  SOPPTUR: 6,
  LANGRENN: 7,
  CAMPINGTUR: 8,
  KAJAKKTUR: 9,
  SNOEHULETUR: 10,
  TRILLETUR: 11,
  KANOTUR: 12,
  TERRENGSYKLING: 13,
  LANDEVEISSYKLING: 14,
  DOWNHILLSYKLING: 15,
  GROTTETUR: 16,
  SYKLING: 17,
  PADLETUR: 18,
  KLATRETUR: 19,
  BRETUR: 20,
  SKOEYTETUR: 21,
  SKITUR: 22,
  FOTTUR: 23,
} as const;

const FAMILY_FRIENDLY_ACTIVITY_IDS = new Set<number>([
  ACTIVITY_TYPE.TRILLETUR,
  ACTIVITY_TYPE.SKOGSTUR,
  ACTIVITY_TYPE.BAERTUR,
  ACTIVITY_TYPE.SOPPTUR,
  ACTIVITY_TYPE.HYTTETUR,
  ACTIVITY_TYPE.FISKETUR,
  ACTIVITY_TYPE.FOTTUR,
  ACTIVITY_TYPE.SKOEYTETUR,
]);

const RISKY_ACTIVITY_IDS = new Set<number>([
  ACTIVITY_TYPE.KLATRETUR,
  ACTIVITY_TYPE.BRETUR,
  ACTIVITY_TYPE.GROTTETUR,
  ACTIVITY_TYPE.DOWNHILLSYKLING,
  ACTIVITY_TYPE.SNOEHULETUR,
]);

type Profile = {
  maxDays: number;
  maxDistanceMeters: number;
  allowedGradings: ReadonlyArray<TripNearItem["grading"]>;
  requireFamilyFriendly: boolean;
};

const PROFILES: Record<MinAgeBand, Profile> = {
  4: {
    maxDays: 1,
    maxDistanceMeters: 5_000,
    allowedGradings: ["EASY"],
    requireFamilyFriendly: true,
  },
  7: {
    maxDays: 1,
    maxDistanceMeters: 10_000,
    allowedGradings: ["EASY"],
    requireFamilyFriendly: false,
  },
  10: {
    maxDays: 2,
    maxDistanceMeters: 20_000,
    allowedGradings: ["EASY", "MODERATE"],
    requireFamilyFriendly: false,
  },
  13: {
    maxDays: 4,
    maxDistanceMeters: 60_000,
    allowedGradings: ["EASY", "MODERATE", "TOUGH"],
    requireFamilyFriendly: false,
  },
};

function tripDays(t: TripNearItem): number {
  const d = t.durationDays ?? 0;
  if (d > 0) return d;
  if ((t.durationHours ?? 0) > 0 || (t.durationMinutes ?? 0) > 0) return 1;
  return 0;
}

function isRiskyActivity(t: TripNearItem): boolean {
  if (t.primaryActivityType === "CLIMBING" || t.primaryActivityType === "GLACIER_TRIP") {
    return true;
  }
  return t.activityTypeIds.some((id) => RISKY_ACTIVITY_IDS.has(id));
}

function isFamilyFriendlyActivity(t: TripNearItem): boolean {
  return t.activityTypeIds.some((id) => FAMILY_FRIENDLY_ACTIVITY_IDS.has(id));
}

export function tripSuitableForAge(
  t: TripNearItem,
  minAge: MinAgeBand,
): boolean {
  const profile = PROFILES[minAge];
  if (isRiskyActivity(t)) return false;

  const days = tripDays(t);
  if (days > profile.maxDays) return false;

  const dist = t.tripDistance ?? 0;
  if (dist > profile.maxDistanceMeters) return false;

  if (t.grading && !profile.allowedGradings.includes(t.grading)) return false;

  if (profile.requireFamilyFriendly && !isFamilyFriendlyActivity(t)) {
    return false;
  }

  return true;
}

export function lowestSuitableAgeBand(t: TripNearItem): MinAgeBand | null {
  for (const band of AGE_BANDS) {
    if (tripSuitableForAge(t, band)) return band;
  }
  return null;
}

export function isChildUnfriendly(t: TripNearItem): boolean {
  if (isRiskyActivity(t)) return true;
  if (t.grading === "VERY_TOUGH") return true;
  const days = tripDays(t);
  if (days >= 5) return true;
  return false;
}

export function unsuitabilityReason(
  t: TripNearItem,
  minAge: MinAgeBand,
): string | null {
  if (tripSuitableForAge(t, minAge)) return null;
  const profile = PROFILES[minAge];

  if (isRiskyActivity(t)) return "Aktivitet ikke egnet for barn";
  if (t.grading === "VERY_TOUGH") return "For krevende";
  const days = tripDays(t);
  if (days > profile.maxDays) {
    return days >= 5 ? "For langvarig" : `For lang varighet`;
  }
  const dist = t.tripDistance ?? 0;
  if (dist > profile.maxDistanceMeters) {
    return `For lang distanse (${(dist / 1000).toFixed(1)} km)`;
  }
  if (t.grading && !profile.allowedGradings.includes(t.grading)) {
    return "For krevende gradering";
  }
  if (profile.requireFamilyFriendly && !isFamilyFriendlyActivity(t)) {
    return "Aktivitet uten klar familieprofil";
  }
  return "Ikke barnevennlig";
}

export function filterByAge(
  trips: TripNearItem[],
  minAge: AgeFilter,
): TripNearItem[] {
  if (minAge === null) return trips;
  return trips.filter((t) => tripSuitableForAge(t, minAge));
}
