import { NextRequest, NextResponse } from "next/server";
import { fetchLocationForecast, aggregateDaily } from "@/lib/met";

export const revalidate = 1800;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const start = searchParams.get("start");
  const end = searchParams.get("end") ?? start;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }
  if (!start || !end) {
    return NextResponse.json(
      { error: "start (YYYY-MM-DD) required" },
      { status: 400 },
    );
  }

  try {
    const forecast = await fetchLocationForecast(lat, lon, {
      signal: req.signal,
    });
    const daily = aggregateDaily(forecast, start, end);
    return NextResponse.json(
      { updatedAt: forecast.updatedAt, daily },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("[/api/weather]", err);
    return NextResponse.json(
      { error: "weather upstream failed" },
      { status: 502 },
    );
  }
}
