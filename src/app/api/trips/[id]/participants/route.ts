import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip } from "@/models/Trip";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  await connectToDatabase();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const status: "accepted" | "declined" | "pending" =
    body.status === "declined"
      ? "declined"
      : body.status === "pending"
      ? "pending"
      : "accepted";

  const email = typeof body.email === "string" ? body.email.trim() : undefined;

  const query = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };

  const trip = await Trip.findOne(query);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const lowered = name.toLowerCase();
  const existing = trip.participants.find(
    (p: { name: string }) => p.name.trim().toLowerCase() === lowered
  );
  if (existing) {
    existing.status = status;
    if (email) existing.email = email;
  } else {
    trip.participants.push({ name, email, status });
  }

  await trip.save();
  return NextResponse.json(trip, { status: 201 });
}
