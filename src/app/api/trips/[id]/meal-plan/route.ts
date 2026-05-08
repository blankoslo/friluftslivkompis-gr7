import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  Trip,
  type IMealDay,
  type IShoppingItem,
  type IConsumable,
  type IParticipant,
} from "@/models/Trip";
import { generateMealPlan } from "@/lib/claude/meal-plan";
import { getTripWeather } from "@/lib/met/forecast";
import { ClaudeApiError } from "@/lib/claude/client";

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

function computeDuration(start: Date | null, end: Date | null, cabins: number): number {
  if (start && end) {
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  }
  if (cabins >= 2) return cabins - 1;
  return 2;
}

function participantsPerDay(
  participants: IParticipant[],
  durationDays: number,
): number[] {
  const days = Array.from({ length: durationDays }, (_, i) => i + 1);
  return days.map((d) => {
    let count = 0;
    for (const p of participants) {
      if (!p.days || p.days.length === 0) {
        count += 1;
      } else if (p.days.includes(d)) {
        count += 1;
      }
    }
    return Math.max(1, count);
  });
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
  const durationDays = computeDuration(start, end, trip.cabins?.length ?? 0);
  const perDay = participantsPerDay(trip.participants, durationDays);

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
      console.error("[/api/trips/:id/meal-plan] weather failed", err);
    }
  }

  try {
    const generated = await generateMealPlan(
      {
        area: trip.area ?? "",
        durationDays,
        participantCount: trip.participants.length || 1,
        participantsPerDay: perDay,
        weather,
      },
      { signal: req.signal },
    );

    const previousShoppingByName = new Map<string, IShoppingItem>(
      (trip.shoppingList ?? []).map((s: IShoppingItem) => [s.name.toLowerCase(), s]),
    );
    const previousConsumablesByName = new Map<string, IConsumable>(
      (trip.consumables ?? []).map((c: IConsumable) => [c.name.toLowerCase(), c]),
    );

    trip.mealPlan = generated.mealPlan as IMealDay[];
    trip.shoppingList = generated.shoppingList.map((item) => {
      const prev = previousShoppingByName.get(item.name.toLowerCase());
      return {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        bought: prev?.bought ?? false,
        assignedTo: prev?.assignedTo,
      };
    }) as unknown as IShoppingItem[];
    trip.consumables = generated.consumables.map((item) => {
      const prev = previousConsumablesByName.get(item.name.toLowerCase());
      return {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        reason: item.reason,
        bought: prev?.bought ?? false,
        assignedTo: prev?.assignedTo,
      };
    }) as unknown as IConsumable[];

    await trip.save();

    return NextResponse.json({
      intro: generated.intro,
      mealPlan: trip.mealPlan,
      shoppingList: serializeShopping(trip.shoppingList),
      consumables: serializeConsumables(trip.consumables),
    });
  } catch (err) {
    if (err instanceof ClaudeApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status ?? 502 },
      );
    }
    console.error("[/api/trips/:id/meal-plan] failed", err);
    return NextResponse.json({ error: "generation failed" }, { status: 500 });
  }
}

interface ShoppingPatch {
  _id?: string;
  bought?: boolean;
  assignedTo?: string | null;
}

interface ConsumablePatch {
  _id?: string;
  bought?: boolean;
  assignedTo?: string | null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json()) as {
    shoppingList?: ShoppingPatch[];
    consumables?: ConsumablePatch[];
  };

  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (Array.isArray(body.shoppingList)) {
    for (const patch of body.shoppingList) {
      if (!patch._id) continue;
      const item = trip.shoppingList.id(patch._id);
      if (!item) continue;
      if (typeof patch.bought === "boolean") item.bought = patch.bought;
      if (patch.assignedTo === null) item.assignedTo = undefined;
      else if (patch.assignedTo && mongoose.isValidObjectId(patch.assignedTo)) {
        item.assignedTo = new mongoose.Types.ObjectId(patch.assignedTo);
      }
    }
  }

  if (Array.isArray(body.consumables)) {
    for (const patch of body.consumables) {
      if (!patch._id) continue;
      const item = trip.consumables.id(patch._id);
      if (!item) continue;
      if (typeof patch.bought === "boolean") item.bought = patch.bought;
      if (patch.assignedTo === null) item.assignedTo = undefined;
      else if (patch.assignedTo && mongoose.isValidObjectId(patch.assignedTo)) {
        item.assignedTo = new mongoose.Types.ObjectId(patch.assignedTo);
      }
    }
  }

  await trip.save();
  return NextResponse.json({
    shoppingList: serializeShopping(trip.shoppingList),
    consumables: serializeConsumables(trip.consumables),
  });
}

function serializeShopping(list: IShoppingItem[]) {
  return list.map((item) => ({
    _id: item._id?.toString(),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    bought: item.bought ?? false,
    assignedTo: item.assignedTo?.toString(),
  }));
}

function serializeConsumables(list: IConsumable[]) {
  return list.map((item) => ({
    _id: item._id?.toString(),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    reason: item.reason,
    bought: item.bought ?? false,
    assignedTo: item.assignedTo?.toString(),
  }));
}
