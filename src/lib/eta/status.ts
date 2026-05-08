export type EtaStatus = "planlagt" | "pa-tur" | "forsinket" | "hjemme";

export const ETA_DELAY_THRESHOLD_MINUTES = 60;
export const ETA_PRE_WINDOW_HOURS = 12;

export interface EtaStatusInput {
  expectedReturnAt: Date;
  now: Date;
  completedAt?: Date | null;
}

export interface EtaStatusResult {
  status: EtaStatus;
  delayMinutes: number;
}

export function computeEtaStatus({
  expectedReturnAt,
  now,
  completedAt,
}: EtaStatusInput): EtaStatusResult {
  if (completedAt) {
    return { status: "hjemme", delayMinutes: 0 };
  }

  const expectedMs = expectedReturnAt.getTime();
  const nowMs = now.getTime();
  const diffMs = nowMs - expectedMs;
  const delayMinutes = Math.round(diffMs / 60000);

  const preWindowMs = ETA_PRE_WINDOW_HOURS * 3600 * 1000;
  const thresholdMs = ETA_DELAY_THRESHOLD_MINUTES * 60 * 1000;

  if (diffMs < -preWindowMs) {
    return { status: "planlagt", delayMinutes };
  }
  if (diffMs > thresholdMs) {
    return { status: "forsinket", delayMinutes };
  }
  return { status: "pa-tur", delayMinutes };
}
