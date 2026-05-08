import { buildTimeline } from "@/lib/timeline";
import { TripTimelineView } from "@/components/timeline/timeline";
import type { CabinPoint } from "@/lib/route";
import { RouteMapLoader } from "./route-map-loader";

interface Props {
  cabins: CabinPoint[];
  startDate: string | null;
  skipElevation: boolean;
}

export async function RouteMapAndTimeline({
  cabins,
  startDate,
  skipElevation,
}: Props) {
  const timeline = await buildTimeline(cabins, startDate, { skipElevation });

  return (
    <div className="flex flex-col gap-md">
      <div className="h-[55vh] min-h-[340px] overflow-hidden rounded-lg border-4 border-flame-pressed shadow-[6px_6px_0_var(--brand-flame-pressed)]">
        <RouteMapLoader cabins={cabins} days={timeline.days} />
      </div>
      <p className="text-xs text-text-muted">
        Klikk på et nummer for dato, etappe-stats og værvarsel. Linjen er
        retningsvisende, ikke faktisk sti.
      </p>
      <TripTimelineView timeline={timeline} />
    </div>
  );
}
