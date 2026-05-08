import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip } from "@/models/Trip";
import { randomBytes } from "crypto";

export async function GET() {
  await connectToDatabase();
  const trips = await Trip.find({}).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = await req.json();

  const createdBy =
    body.createdBy && mongoose.isValidObjectId(body.createdBy)
      ? body.createdBy
      : new mongoose.Types.ObjectId();

  const trip = await Trip.create({
    ...body,
    createdBy,
    inviteToken: randomBytes(16).toString("hex"),
  });

  return NextResponse.json(trip, { status: 201 });
}
