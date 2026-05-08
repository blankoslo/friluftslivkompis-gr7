"use client";

import dynamic from "next/dynamic";
import type { Cabin, Trip } from "@/lib/ut";

const OfflineMap = dynamic(
  () => import("./offline-map").then((m) => m.OfflineMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-md border border-border bg-surface text-small text-text-muted">
        Laster offline-kart…
      </div>
    ),
  },
);

export function OfflineMapLoader({
  trip,
  cabins,
}: {
  trip: Trip;
  cabins: Cabin[];
}) {
  return <OfflineMap trip={trip} cabins={cabins} />;
}
