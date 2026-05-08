import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllDntCabins,
  listCabinsFromSnapshot,
  SNAPSHOT_GENERATED_AT,
  SNAPSHOT_SOURCE,
  type CabinListItem,
} from "@/lib/ut";

export const revalidate = 86400;

function toFeatureCollection(cabins: CabinListItem[], stale: boolean) {
  return {
    type: "FeatureCollection" as const,
    stale,
    snapshotAt: stale ? SNAPSHOT_GENERATED_AT : null,
    snapshotSource: stale ? SNAPSHOT_SOURCE : null,
    features: cabins.map((c) => ({
      type: "Feature" as const,
      id: c.id,
      geometry: { type: "Point" as const, coordinates: [c.lon, c.lat] },
      properties: {
        id: c.id,
        name: c.name,
        serviceLevel: c.serviceLevel,
        dntCabin: c.dntCabin,
        bedsStaffed: c.bedsStaffed ?? 0,
        bedsSelfService: c.bedsSelfService ?? 0,
        bedsNoService: c.bedsNoService ?? 0,
        bedsExtra: c.bedsExtra ?? 0,
        bedsWinter: c.bedsWinter ?? 0,
        stale,
      },
    })),
  };
}

export async function GET(req: NextRequest) {
  try {
    const cabins = await fetchAllDntCabins({ signal: req.signal });
    return NextResponse.json(toFeatureCollection(cabins, false), {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("[/api/cabins] upstream failed, using snapshot", err);
    const fallback = listCabinsFromSnapshot();
    return NextResponse.json(toFeatureCollection(fallback, true), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Data-Source": "snapshot",
      },
    });
  }
}
