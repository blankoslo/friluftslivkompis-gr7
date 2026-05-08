import { NextRequest, NextResponse } from "next/server";
import { fetchAllDntCabins } from "@/lib/ut";

export const revalidate = 86400;

export async function GET(req: NextRequest) {
  try {
    const cabins = await fetchAllDntCabins({ signal: req.signal });

    const features = cabins.map((c) => ({
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
      },
    }));

    return NextResponse.json(
      { type: "FeatureCollection", features },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (err) {
    console.error("[/api/cabins]", err);
    return NextResponse.json(
      { error: "cabins upstream failed", type: "FeatureCollection", features: [] },
      { status: 502 },
    );
  }
}
