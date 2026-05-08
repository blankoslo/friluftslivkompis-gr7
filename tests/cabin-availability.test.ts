import { describe, it, expect } from "vitest";
import { assessAvailability } from "@/lib/ut/availability";

function cabin(over: Partial<Parameters<typeof assessAvailability>[0]> = {}) {
  return {
    id: 1,
    name: "Testhytta",
    dntCabin: true,
    serviceLevel: "SELF_SERVICE",
    bedsStaffed: 0,
    bedsSelfService: 8,
    bedsNoService: 0,
    bookingEnabled: false,
    bookingOnly: false,
    bookingUrl: null,
    geojson: null,
    ...over,
  };
}

describe("assessAvailability", () => {
  it("marks a self-service DNT cabin with enough beds as ledig", () => {
    const info = assessAvailability(cabin(), 4);
    expect(info.status).toBe("ledig");
    expect(info.beds.total).toBe(8);
    expect(info.dntCabin).toBe(true);
  });

  it("returns fullt when persons exceed total beds", () => {
    const info = assessAvailability(cabin({ bedsSelfService: 2 }), 5);
    expect(info.status).toBe("fullt");
    expect(info.reason).toMatch(/2 senger/);
  });

  it("returns ukjent for booking-only cabins regardless of beds", () => {
    const info = assessAvailability(cabin({ bookingOnly: true }), 1);
    expect(info.status).toBe("ukjent");
    expect(info.reason).toMatch(/forhåndsbestilling/);
  });

  it("returns ukjent for non-DNT cabins", () => {
    const info = assessAvailability(cabin({ dntCabin: false }), 2);
    expect(info.status).toBe("ukjent");
    expect(info.reason).toMatch(/Ikke en DNT-hytte/);
  });
});
