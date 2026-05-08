import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITripCabin } from "@/models/Trip";
import {
  pickCabinsFromUtTrip,
  pickCabinsNear,
  type AutoCabinPick,
} from "@/lib/ut";

interface AutoBody {
  lat?: number;
  lon?: number;
  utTripId?: number;
  count?: number;
}

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as AutoBody;

  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let picks: AutoCabinPick[] = [];
  try {
    if (typeof body.utTripId === "number" && Number.isFinite(body.utTripId)) {
      picks = await pickCabinsFromUtTrip(body.utTripId);
      if (picks.length === 0 && typeof body.lat === "number" && typeof body.lon === "number") {
        picks = await pickCabinsNear(body.lat, body.lon, { count: body.count });
      }
    } else if (
      typeof body.lat === "number" &&
      typeof body.lon === "number" &&
      Number.isFinite(body.lat) &&
      Number.isFinite(body.lon)
    ) {
      picks = await pickCabinsNear(body.lat, body.lon, { count: body.count });
    } else {
      return NextResponse.json(
        { error: "lat/lon or utTripId required" },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("[auto cabins]", err);
    return NextResponse.json({ ok: true, added: 0, cabins: trip.cabins });
  }

  let added = 0;
  for (const pick of picks) {
    const dup = trip.cabins.some(
      (c: ITripCabin) =>
        (pick.utId !== undefined && c.utId === pick.utId) ||
        (c.name === pick.name &&
          Math.abs(c.lat - pick.lat) < 0.001 &&
          Math.abs(c.lon - pick.lon) < 0.001),
    );
    if (dup) continue;
    trip.cabins.push({
      utId: pick.utId,
      name: pick.name,
      lat: pick.lat,
      lon: pick.lon,
    });
    added++;
  }

  if (added > 0) await trip.save();

  return NextResponse.json({
    ok: true,
    added,
    tripId: trip._id.toString(),
    cabins: trip.cabins,
  });
}
