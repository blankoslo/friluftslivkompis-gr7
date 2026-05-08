"use client";

import dynamic from "next/dynamic";
import type { CabinPoint } from "@/lib/route";
import type { TripTimeline } from "@/lib/timeline";

const RouteMap = dynamic(
  () => import("./route-map").then((m) => m.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full w-full items-center justify-center bg-bg text-flame-pressed"
        style={{ fontFamily: "var(--font-handwriting)", fontSize: "18px" }}
      >
        Laster kartet...
      </div>
    ),
  },
);

interface Props {
  cabins: CabinPoint[];
  days: TripTimeline["days"];
}

export function RouteMapLoader({ cabins, days }: Props) {
  return <RouteMap cabins={cabins} days={days} />;
}
