import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip } from "@/models/Trip";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ExpenseBody {
  description?: unknown;
  amount?: unknown;
  paidBy?: unknown;
  splitAmong?: unknown;
  dayNumber?: unknown;
}

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as ExpenseBody;

  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const amount = typeof body.amount === "number" ? body.amount : NaN;
  const paidByRaw = typeof body.paidBy === "string" ? body.paidBy : "";
  const splitAmongRaw = Array.isArray(body.splitAmong)
    ? (body.splitAmong as unknown[]).filter(
        (v): v is string => typeof v === "string",
      )
    : [];
  const dayNumber =
    typeof body.dayNumber === "number" && Number.isFinite(body.dayNumber)
      ? body.dayNumber
      : undefined;

  if (!description) {
    return NextResponse.json(
      { error: "Beskrivelse er påkrevd" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Beløp må være større enn 0" },
      { status: 400 },
    );
  }
  if (!mongoose.isValidObjectId(paidByRaw)) {
    return NextResponse.json(
      { error: "Ugyldig betaler" },
      { status: 400 },
    );
  }

  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const participantIds = new Set(
    trip.participants.map((p: { _id: mongoose.Types.ObjectId }) =>
      p._id.toString(),
    ),
  );
  if (!participantIds.has(paidByRaw)) {
    return NextResponse.json(
      { error: "Betaler er ikke deltaker" },
      { status: 400 },
    );
  }
  const splitAmong = splitAmongRaw.filter((pid) => participantIds.has(pid));

  trip.expenses.push({
    description,
    amount,
    paidBy: new mongoose.Types.ObjectId(paidByRaw),
    splitAmong: splitAmong.map((pid) => new mongoose.Types.ObjectId(pid)),
    dayNumber,
  });

  await trip.save();
  return NextResponse.json(trip.toObject(), { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  await connectToDatabase();
  const { id } = await params;
  const url = new URL(req.url);
  const expenseId = url.searchParams.get("expenseId");
  if (!expenseId || !mongoose.isValidObjectId(expenseId)) {
    return NextResponse.json(
      { error: "expenseId required" },
      { status: 400 },
    );
  }

  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const before = trip.expenses.length;
  trip.expenses = trip.expenses.filter(
    (e: { _id?: mongoose.Types.ObjectId }) => e._id?.toString() !== expenseId,
  );
  if (trip.expenses.length === before) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  await trip.save();
  return NextResponse.json(trip.toObject());
}
