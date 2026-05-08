import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITripCabin } from "@/models/Trip";

interface CabinBody {
  name: string;
  lat: number;
  lon: number;
  utId?: number;
}

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

function isCabinBody(value: unknown): value is CabinBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    v.name.length > 0 &&
    typeof v.lat === "number" &&
    typeof v.lon === "number" &&
    Number.isFinite(v.lat) &&
    Number.isFinite(v.lon)
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json()) as { cabin?: unknown };
  if (!isCabinBody(body.cabin)) {
    return NextResponse.json({ error: "cabin required" }, { status: 400 });
  }

  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cabin = body.cabin;
  const exists = trip.cabins.some(
    (c: ITripCabin) =>
      (cabin.utId !== undefined && c.utId === cabin.utId) ||
      (c.name === cabin.name &&
        Math.abs(c.lat - cabin.lat) < 0.001 &&
        Math.abs(c.lon - cabin.lon) < 0.001),
  );
  if (exists) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      tripId: trip._id.toString(),
      title: trip.title,
      cabins: trip.cabins,
    });
  }

  trip.cabins.push({
    utId: cabin.utId,
    name: cabin.name,
    lat: cabin.lat,
    lon: cabin.lon,
  });
  await trip.save();

  return NextResponse.json({
    ok: true,
    duplicate: false,
    tripId: trip._id.toString(),
    title: trip.title,
    cabins: trip.cabins,
  });
}
