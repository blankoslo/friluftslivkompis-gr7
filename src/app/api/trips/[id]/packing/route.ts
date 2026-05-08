import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip } from "@/models/Trip";
import { generatePackingList } from "@/lib/claude/packing";
import { getTripWeather } from "@/lib/met/forecast";
import { ClaudeApiError } from "@/lib/claude/client";

interface PackingItemBody {
  name: string;
  packed?: boolean;
  isAiSuggested?: boolean;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const trip = await Trip.findById(id);
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
      (item: PackingItemBody) => !item.isAiSuggested,
    );
    const aiItems = generated.items.map((item) => ({
      name: `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`,
      packed: false,
      isAiSuggested: true,
    }));

    trip.packingList = [...aiItems, ...userKept];
    await trip.save();

    return NextResponse.json({
      intro: generated.intro,
      items: generated.items,
      packingList: trip.packingList,
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

  const trip = await Trip.findByIdAndUpdate(
    id,
    {
      packingList: body.packingList.map((item) => ({
        name: item.name,
        packed: item.packed ?? false,
        isAiSuggested: item.isAiSuggested ?? false,
      })),
    },
    { new: true },
  ).lean();

  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trip);
}
