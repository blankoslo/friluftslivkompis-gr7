import type { TripNearItem } from "@/lib/ut";

export type TripCategory =
  | "dagtur"
  | "helgetur"
  | "familievennlig"
  | "ski"
  | "paddling";

export const TRIP_CATEGORIES: TripCategory[] = [
  "dagtur",
  "helgetur",
  "familievennlig",
  "ski",
  "paddling",
];

export const CATEGORY_LABEL: Record<TripCategory, string> = {
  dagtur: "Dagtur",
  helgetur: "Helgetur",
  familievennlig: "Familievennlig",
  ski: "Ski",
  paddling: "Padling",
};

export const CATEGORY_DESCRIPTION: Record<TripCategory, string> = {
  dagtur: "1 dag, korte etapper",
  helgetur: "2 til 3 dager",
  familievennlig: "Lett gradering, godt egnet for barn",
  ski: "Ski og toppturer",
  paddling: "Kano og kajakk",
};

function tripDays(t: TripNearItem): number {
  const d = t.durationDays ?? 0;
  if (d > 0) return d;
  if ((t.durationHours ?? 0) > 0 || (t.durationMinutes ?? 0) > 0) return 1;
  return 0;
}

export function tripCategories(t: TripNearItem): Set<TripCategory> {
  const cats = new Set<TripCategory>();
  const days = tripDays(t);

  if (days === 1) cats.add("dagtur");
  if (days >= 2 && days <= 3) cats.add("helgetur");
  if (t.grading === "EASY" && days <= 1) cats.add("familievennlig");
  if (t.primaryActivityType === "SKI_TOURING") cats.add("ski");
  if (t.primaryActivityType === "PADLING") cats.add("paddling");

  return cats;
}

export function filterTrips(
  trips: TripNearItem[],
  active: ReadonlySet<TripCategory>,
): TripNearItem[] {
  if (active.size === 0) return trips;
  return trips.filter((t) => {
    const cats = tripCategories(t);
    for (const want of active) {
      if (!cats.has(want)) return false;
    }
    return true;
  });
}

export function categoryCounts(
  trips: TripNearItem[],
): Record<TripCategory, number> {
  const counts: Record<TripCategory, number> = {
    dagtur: 0,
    helgetur: 0,
    familievennlig: 0,
    ski: 0,
    paddling: 0,
  };
  for (const t of trips) {
    for (const c of tripCategories(t)) counts[c]++;
  }
  return counts;
}

export function suggestRemoval(
  trips: TripNearItem[],
  active: ReadonlySet<TripCategory>,
): TripCategory | null {
  if (active.size <= 1) return null;
  let mostRestrictive: TripCategory | null = null;
  let smallestCount = Infinity;
  for (const cat of active) {
    let count = 0;
    for (const t of trips) {
      if (tripCategories(t).has(cat)) count++;
    }
    if (count < smallestCount) {
      smallestCount = count;
      mostRestrictive = cat;
    }
  }
  return mostRestrictive;
}
