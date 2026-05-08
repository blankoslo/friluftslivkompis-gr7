import { NextRequest, NextResponse } from "next/server";
import { fetchTripsNear } from "@/lib/ut";

export const revalidate = 600;

const MAX_RADIUS_M = 200_000;
const DEFAULT_RADIUS_M = 50_000;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const lonParam = url.searchParams.get("lon");
  const latParam = url.searchParams.get("lat");
  const lon = lonParam ? Number(lonParam) : NaN;
  const lat = latParam ? Number(latParam) : NaN;
  const radius = Number(url.searchParams.get("radius") ?? DEFAULT_RADIUS_M);

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return NextResponse.json(
      { error: "lon and lat query params required", trips: [] },
      { status: 400 },
    );
  }
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
    return NextResponse.json(
      { error: "lon/lat out of range", trips: [] },
      { status: 400 },
    );
  }

  const clampedRadius = Math.min(
    Math.max(Math.floor(radius), 1000),
    MAX_RADIUS_M,
  );

  try {
    const trips = await fetchTripsNear(lon, lat, clampedRadius, {
      signal: req.signal,
    });
    return NextResponse.json(
      { trips },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("[/api/trips/near]", err);
    return NextResponse.json(
      { error: "trips upstream failed", trips: [] },
      { status: 502 },
    );
  }
}
