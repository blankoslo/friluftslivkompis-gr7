import { describe, it, expect } from "vitest";
import { computeLegs, type CabinPoint } from "@/lib/route";
import { haversineKm, naismithHours } from "@/lib/route/geo";

const gjendebu: CabinPoint = { name: "Gjendebu", lat: 61.4961, lon: 8.6311 };
const memurubu: CabinPoint = { name: "Memurubu", lat: 61.5519, lon: 8.7494 };
const gjendesheim: CabinPoint = { name: "Gjendesheim", lat: 61.4906, lon: 8.8022 };

describe("route geometry primitives", () => {
  it("haversine matches known Gjendebu→Memurubu distance within tolerance", () => {
    const km = haversineKm(gjendebu, memurubu);
    expect(km).toBeGreaterThan(7);
    expect(km).toBeLessThan(10);
  });

  it("Naismith adds ~1 hour per 600m of climb", () => {
    expect(naismithHours(0, 600)).toBeCloseTo(1, 5);
    expect(naismithHours(8, 0)).toBeCloseTo(2, 5);
  });
});

describe("computeLegs", () => {
  it("builds N-1 legs with day numbers and aggregated totals when elevation is skipped", async () => {
    const legs = await computeLegs([gjendebu, memurubu, gjendesheim], { skipElevation: true });
    expect(legs).toHaveLength(2);
    expect(legs.map((l) => l.dayNumber)).toEqual([1, 2]);
    for (const leg of legs) {
      expect(leg.hasElevationData).toBe(false);
      expect(leg.elevationGain).toBe(0);
      expect(leg.distanceKm).toBeGreaterThan(0);
      expect(leg.estimatedHours).toBeGreaterThan(0);
      expect(["easy", "moderate", "tough"]).toContain(leg.difficulty);
    }
  });

  it("returns empty array when fewer than two cabins", async () => {
    expect(await computeLegs([], { skipElevation: true })).toEqual([]);
    expect(await computeLegs([gjendebu], { skipElevation: true })).toEqual([]);
  });
});
