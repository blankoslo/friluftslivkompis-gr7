import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type IReminder } from "@/models/Trip";

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

interface ReminderPatch {
  _id?: string;
  daysBefore: number;
  label: string;
  kind?: IReminder["kind"];
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json()) as { reminders: ReminderPatch[] };
  if (!Array.isArray(body.reminders)) {
    return NextResponse.json({ error: "reminders required" }, { status: 400 });
  }

  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  trip.reminders = body.reminders.map((r) => {
    const next: Partial<IReminder> & { daysBefore: number; label: string } = {
      daysBefore: Math.max(0, Math.round(r.daysBefore)),
      label: r.label.trim(),
      kind: r.kind ?? "annet",
    };
    if (r._id && mongoose.isValidObjectId(r._id)) {
      (next as { _id?: mongoose.Types.ObjectId })._id =
        new mongoose.Types.ObjectId(r._id);
    }
    return next;
  }) as IReminder[];

  await trip.save();
  return NextResponse.json({
    reminders: trip.reminders.map((r: IReminder) => ({
      _id: r._id?.toString(),
      daysBefore: r.daysBefore,
      label: r.label,
      kind: r.kind,
    })),
  });
}
