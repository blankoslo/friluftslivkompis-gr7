import { NextRequest, NextResponse } from "next/server";
import { getCabin, getTrip, type Cabin, type Trip } from "@/lib/ut";

export const revalidate = 86400;

export type OfflineTripPayload = {
  trip: Trip;
  cabins: Cabin[];
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const trip = await getTrip(id, { signal: req.signal });
    if (!trip) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const cabins = await Promise.all(
      trip.cabinIds.map((cid) =>
        getCabin(cid, { signal: req.signal }).catch(() => null),
      ),
    );

    const payload: OfflineTripPayload = {
      trip,
      cabins: cabins.filter((c): c is Cabin => c !== null),
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("[/api/ut-trips/:id]", err);
    return NextResponse.json(
      { error: "trip upstream failed" },
      { status: 502 },
    );
  }
}
