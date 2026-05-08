import { describe, expect, it } from "vitest";
import {
  computeEtaStatus,
  ETA_DELAY_THRESHOLD_MINUTES,
  ETA_PRE_WINDOW_HOURS,
} from "../src/lib/eta/status";

const eta = new Date("2026-05-08T18:00:00Z");

describe("computeEtaStatus", () => {
  it("returns hjemme when completedAt is set", () => {
    const result = computeEtaStatus({
      expectedReturnAt: eta,
      now: new Date("2026-05-08T19:00:00Z"),
      completedAt: new Date("2026-05-08T17:55:00Z"),
    });
    expect(result.status).toBe("hjemme");
  });

  it("returns planlagt when more than pre-window hours before ETA", () => {
    const now = new Date(
      eta.getTime() - (ETA_PRE_WINDOW_HOURS + 1) * 3600 * 1000,
    );
    const result = computeEtaStatus({ expectedReturnAt: eta, now });
    expect(result.status).toBe("planlagt");
  });

  it("returns pa-tur within the pre-window and just after ETA", () => {
    const a = computeEtaStatus({
      expectedReturnAt: eta,
      now: new Date(eta.getTime() - 2 * 3600 * 1000),
    });
    const b = computeEtaStatus({
      expectedReturnAt: eta,
      now: new Date(eta.getTime() + 30 * 60 * 1000),
    });
    expect(a.status).toBe("pa-tur");
    expect(b.status).toBe("pa-tur");
  });

  it("returns forsinket past delay threshold", () => {
    const now = new Date(
      eta.getTime() + (ETA_DELAY_THRESHOLD_MINUTES + 5) * 60 * 1000,
    );
    const result = computeEtaStatus({ expectedReturnAt: eta, now });
    expect(result.status).toBe("forsinket");
    expect(result.delayMinutes).toBeGreaterThanOrEqual(
      ETA_DELAY_THRESHOLD_MINUTES,
    );
  });

  it("delayMinutes is negative before ETA", () => {
    const result = computeEtaStatus({
      expectedReturnAt: eta,
      now: new Date(eta.getTime() - 10 * 60 * 1000),
    });
    expect(result.delayMinutes).toBeLessThan(0);
  });
});
