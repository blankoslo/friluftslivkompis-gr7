"use client";

import dynamic from "next/dynamic";

type CabinPin = {
  name: string;
  lat: number;
  lon: number;
};

const InviteMap = dynamic(
  () => import("./invite-map").then((m) => m.InviteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 sm:h-96 w-full items-center justify-center rounded-md border-2 border-flame-pressed bg-bg text-small text-text-muted">
        Laster kart...
      </div>
    ),
  },
);

export function InviteMapLoader({ cabins }: { cabins: CabinPin[] }) {
  return <InviteMap cabins={cabins} />;
}
