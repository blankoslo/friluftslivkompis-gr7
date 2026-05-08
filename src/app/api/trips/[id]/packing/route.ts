import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type IPackingItem } from "@/models/Trip";
import { generatePackingList, snapshotKey } from "@/lib/claude/packing";
import { getTripWeather } from "@/lib/met/forecast";
import { ClaudeApiError } from "@/lib/claude/client";

interface PackingItemBody {
  _id?: string;
  name: string;
  packed?: boolean;
  isAiSuggested?: boolean;
  assignedTo?: string | null;
  quantity?: number;
  category?: IPackingItem["category"];
  isShared?: boolean;
  weightGrams?: number;
  reason?: string;
  isNew?: boolean;
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
  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const start = trip.startDate ? new Date(trip.startDate) : null;
  const end = trip.endDate ? new Date(trip.endDate) : null;
  const durationDays =
    start && end
      ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
      : 2;

  let weather = null;
  if (trip.location?.lat && trip.location?.lng && start && end) {
    try {
      weather = await getTripWeather(
        trip.location.lat,
        trip.location.lng,
        start,
        end,
        { signal: req.signal },
      );
    } catch (err) {
      console.error("[/api/trips/:id/packing] weather failed", err);
    }
  }

  try {
    const generated = await generatePackingList(
      {
        area: trip.area ?? "",
        startDate: start?.toISOString().slice(0, 10),
        endDate: end?.toISOString().slice(0, 10),
        durationDays,
        participantCount: trip.participants.length,
        participantNames: trip.participants.map((p: { name: string }) => p.name),
        weather,
      },
      { signal: req.signal },
    );

    const userKept = trip.packingList.filter(
      (item: IPackingItem) => !item.isAiSuggested,
    );
    const previousAi = trip.packingList.filter(
      (item: IPackingItem) => item.isAiSuggested,
    );
    const previousAiByName = new Map<string, IPackingItem>(
      previousAi.map((p: IPackingItem) => [p.name.toLowerCase(), p]),
    );

    const aiItems = generated.items.map((item) => {
      const name = `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`;
      const previous = previousAiByName.get(name.toLowerCase());
      return {
        name,
        packed: previous?.packed ?? false,
        assignedTo: previous?.assignedTo,
        isAiSuggested: true,
        quantity: item.quantity,
        category: item.category,
        isShared: item.isShared,
        weightGrams: item.weightGrams,
        reason: item.reason,
      };
    });

    trip.packingList = [...aiItems, ...userKept];
    trip.packingSnapshot = {
      ...snapshotKey({
        participantCount: trip.participants.length,
        durationDays,
        weather,
      }),
      generatedAt: new Date(),
    };
    await trip.save();

    return NextResponse.json({
      intro: generated.intro,
      items: generated.items,
      packingList: serializePacking(trip.packingList),
      weather,
    });
  } catch (err) {
    if (err instanceof ClaudeApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status ?? 502 },
      );
    }
    console.error("[/api/trips/:id/packing] failed", err);
    return NextResponse.json({ error: "generation failed" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json()) as { packingList: PackingItemBody[] };

  if (!Array.isArray(body.packingList)) {
    return NextResponse.json({ error: "packingList required" }, { status: 400 });
  }

  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  trip.packingList = body.packingList.map((item) => {
    const next: Partial<IPackingItem> & { name: string } = {
      name: item.name,
      packed: item.packed ?? false,
      isAiSuggested: item.isAiSuggested ?? false,
      quantity: item.quantity ?? 1,
      category: item.category,
      isShared: item.isShared ?? false,
      weightGrams: item.weightGrams,
      reason: item.reason,
    };
    if (item._id && mongoose.isValidObjectId(item._id) && !item.isNew) {
      (next as { _id?: mongoose.Types.ObjectId })._id =
        new mongoose.Types.ObjectId(item._id);
    }
    if (item.assignedTo && mongoose.isValidObjectId(item.assignedTo)) {
      next.assignedTo = new mongoose.Types.ObjectId(item.assignedTo);
    } else {
      next.assignedTo = undefined;
    }
    return next;
  }) as IPackingItem[];

  await trip.save();
  return NextResponse.json({ packingList: serializePacking(trip.packingList) });
}

function serializePacking(list: IPackingItem[]) {
  return list.map((item) => ({
    _id: item._id?.toString(),
    name: item.name,
    packed: item.packed,
    isAiSuggested: item.isAiSuggested,
    quantity: item.quantity ?? 1,
    category: item.category,
    isShared: item.isShared ?? false,
    weightGrams: item.weightGrams,
    reason: item.reason,
    assignedTo: item.assignedTo?.toString(),
  }));
}
