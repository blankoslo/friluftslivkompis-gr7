import { NextRequest, NextResponse } from "next/server";
import { computeLegs, type CabinPoint } from "@/lib/route";

export const revalidate = 86400;

export async function POST(req: NextRequest) {
  let body: { cabins?: CabinPoint[]; skipElevation?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const cabins = body.cabins;
  if (!Array.isArray(cabins) || cabins.length < 2) {
    return NextResponse.json(
      { error: "cabins[] with at least 2 entries required" },
      { status: 400 },
    );
  }
  for (const c of cabins) {
    if (
      typeof c?.lat !== "number" ||
      typeof c?.lon !== "number" ||
      typeof c?.name !== "string"
    ) {
      return NextResponse.json(
        { error: "each cabin needs name, lat, lon" },
        { status: 400 },
      );
    }
  }

  try {
    const legs = await computeLegs(cabins, {
      signal: req.signal,
      skipElevation: body.skipElevation,
    });
    const totals = legs.reduce(
      (acc, l) => ({
        distanceKm: acc.distanceKm + l.distanceKm,
        elevationGain: acc.elevationGain + l.elevationGain,
        elevationLoss: acc.elevationLoss + l.elevationLoss,
        estimatedHours: acc.estimatedHours + l.estimatedHours,
      }),
      { distanceKm: 0, elevationGain: 0, elevationLoss: 0, estimatedHours: 0 },
    );
    return NextResponse.json({
      legs,
      totals: {
        distanceKm: Math.round(totals.distanceKm * 10) / 10,
        elevationGain: Math.round(totals.elevationGain),
        elevationLoss: Math.round(totals.elevationLoss),
        estimatedHours: Math.round(totals.estimatedHours * 10) / 10,
      },
    });
  } catch (err) {
    console.error("[/api/route]", err);
    return NextResponse.json({ error: "route compute failed" }, { status: 502 });
  }
}
