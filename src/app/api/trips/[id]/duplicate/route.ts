import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITrip } from "@/models/Trip";

interface DuplicateBody {
  startDate?: string;
  endDate?: string;
  title?: string;
}

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

function nextYearTitle(title: string): string {
  const year = new Date().getFullYear();
  const stripped = title.replace(/\s*\b(20\d{2})\b\s*$/, "").trim();
  return `${stripped} ${year + 1}`.trim();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as DuplicateBody;

  const source = await Trip.findOne(tripQuery(id)).lean<ITrip | null>();
  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const start = body.startDate ? new Date(body.startDate) : undefined;
  const end = body.endDate ? new Date(body.endDate) : undefined;

  const cloneSubdocs = <T extends { _id?: mongoose.Types.ObjectId }>(arr?: T[]) =>
    (arr ?? []).map(({ _id: _drop, ...rest }) => rest);

  const newDoc = await Trip.create({
    title: body.title?.trim() || nextYearTitle(source.title),
    inviteToken: randomBytes(16).toString("hex"),
    phase: "discover",
    area: source.area,
    startDate: start,
    endDate: end,
    location: source.location,
    cabins: (source.cabins ?? []).map((c) => ({
      utId: c.utId,
      name: c.name,
      lat: c.lat,
      lon: c.lon,
    })),
    legs: (source.legs ?? []).map((l) => ({
      dayNumber: l.dayNumber,
      fromHut: l.fromHut,
      toHut: l.toHut,
      distanceKm: l.distanceKm,
      elevationGain: l.elevationGain,
      estimatedHours: l.estimatedHours,
    })),
    participants: (source.participants ?? []).map((p) => ({
      userId: p.userId,
      name: p.name,
      email: p.email,
      status: "pending",
      days: p.days,
    })),
    packingList: cloneSubdocs(source.packingList).map((item) => ({
      ...item,
      packed: false,
      assignedTo: undefined,
    })),
    mealPlan: (source.mealPlan ?? []).map((d) => ({
      dayNumber: d.dayNumber,
      participantsToday: d.participantsToday,
      meals: d.meals,
    })),
    shoppingList: cloneSubdocs(source.shoppingList).map((item) => ({
      ...item,
      bought: false,
      assignedTo: undefined,
    })),
    consumables: cloneSubdocs(source.consumables).map((item) => ({
      ...item,
      bought: false,
      assignedTo: undefined,
    })),
    reminders: cloneSubdocs(source.reminders),
    emergencyContacts: cloneSubdocs(source.emergencyContacts),
    expenses: [],
    createdBy: source.createdBy,
  });

  return NextResponse.json(
    {
      id: newDoc._id.toString(),
      inviteToken: newDoc.inviteToken,
      title: newDoc.title,
      cabinCount: newDoc.cabins?.length ?? 0,
      participantCount: newDoc.participants?.length ?? 0,
    },
    { status: 201 },
  );
}
