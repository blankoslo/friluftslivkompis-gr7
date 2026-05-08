export const SERVICE_LEVEL_LABEL: Record<string, string> = {
  STAFFED: "Betjent",
  SELF_SERVICE: "Selvbetjent",
  NO_SERVICE: "Ubetjent",
  NO_SERVICE_NO_BEDS: "Dagsturhytte",
  EMERGENCY_SHELTER: "Nødbu",
  CLOSED: "Stengt",
  RENTAL: "Utleie",
};

export function serviceLevelLabel(level: string | null | undefined): string {
  if (!level) return "Ukjent";
  return SERVICE_LEVEL_LABEL[level] ?? level;
}

export type CabinAccessibility = {
  status: "open" | "closed" | "winter-only" | "unknown";
  label: string;
};

export function cabinAccessibility(cabin: {
  serviceLevel: string | null;
  bedsWinter: number | null;
  bedsStaffed: number | null;
  bedsSelfService: number | null;
  bedsNoService: number | null;
}): CabinAccessibility {
  if (cabin.serviceLevel === "CLOSED") {
    return { status: "closed", label: "Stengt" };
  }
  const totalSummer =
    (cabin.bedsStaffed ?? 0) +
    (cabin.bedsSelfService ?? 0) +
    (cabin.bedsNoService ?? 0);
  const winter = cabin.bedsWinter ?? 0;
  if (totalSummer === 0 && winter === 0) {
    return { status: "unknown", label: "Ingen sengeplasser oppgitt" };
  }
  if (totalSummer === 0 && winter > 0) {
    return { status: "winter-only", label: "Kun vinterrom" };
  }
  if (winter > 0) {
    return { status: "open", label: "Åpen sommer + vinterrom" };
  }
  return { status: "open", label: "Åpen sommer" };
}

export function totalBeds(cabin: {
  bedsStaffed: number | null;
  bedsSelfService: number | null;
  bedsNoService: number | null;
  bedsExtra: number | null;
  bedsWinter: number | null;
}): number {
  return (
    (cabin.bedsStaffed ?? 0) +
    (cabin.bedsSelfService ?? 0) +
    (cabin.bedsNoService ?? 0) +
    (cabin.bedsExtra ?? 0) +
    (cabin.bedsWinter ?? 0)
  );
}
