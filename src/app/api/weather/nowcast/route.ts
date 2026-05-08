import { NextRequest, NextResponse } from "next/server";
import { fetchNowcast, pickCurrentNowcast } from "@/lib/met";

export const revalidate = 180;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  try {
    const nowcast = await fetchNowcast(lat, lon, { signal: req.signal });
    const snapshot = pickCurrentNowcast(nowcast);
    if (!snapshot) {
      return NextResponse.json(
        {
          stale: true,
          snapshotAt: null,
          snapshotSource: "met-nowcast",
          updatedAt: nowcast.updatedAt,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      {
        ...snapshot,
        updatedAt: nowcast.updatedAt,
        stale: false,
        snapshotAt: null,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=180, stale-while-revalidate=600",
        },
      },
    );
  } catch (err) {
    console.error("[/api/weather/nowcast]", err);
    return NextResponse.json(
      {
        stale: true,
        snapshotAt: null,
        snapshotSource: "met-nowcast",
        error: "nowcast upstream failed",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
