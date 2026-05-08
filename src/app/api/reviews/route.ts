import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  Review,
  type IReview,
  type ReviewGroupSize,
  type ReviewSeason,
} from "@/models/Review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEASONS: ReviewSeason[] = ["vinter", "vår", "sommer", "høst"];
const GROUP_SIZES: ReviewGroupSize[] = [
  "alene",
  "par",
  "familie",
  "venner",
  "stor-gjeng",
];

function serialize(doc: IReview) {
  return {
    id: String(doc._id),
    utTripId: doc.utTripId,
    tripId: doc.tripId ? String(doc.tripId) : undefined,
    targetTitle: doc.targetTitle,
    targetArea: doc.targetArea,
    rating: doc.rating,
    text: doc.text,
    tags: doc.tags ?? [],
    season: doc.season,
    groupSize: doc.groupSize,
    visitedAt: doc.visitedAt,
    authorName: doc.authorName,
    createdAt: doc.createdAt,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const utTripIdRaw = searchParams.get("utTripId");
  const tripId = searchParams.get("tripId");
  const filter: Record<string, unknown> = {};
  if (utTripIdRaw) {
    const num = Number(utTripIdRaw);
    if (!Number.isFinite(num)) {
      return NextResponse.json(
        { error: "Ugyldig utTripId" },
        { status: 400 },
      );
    }
    filter.utTripId = num;
  }
  if (tripId) {
    if (!mongoose.isValidObjectId(tripId)) {
      return NextResponse.json({ error: "Ugyldig tripId" }, { status: 400 });
    }
    filter.tripId = new mongoose.Types.ObjectId(tripId);
  }
  await connectToDatabase();
  const docs = await Review.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean<IReview[]>();
  const reviews = docs.map((d) => serialize(d));
  const ratings = reviews.map((r) => r.rating);
  const avg =
    ratings.length === 0
      ? null
      : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
        10;
  return NextResponse.json({
    reviews,
    count: reviews.length,
    avg,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    utTripId?: number;
    tripId?: string;
    targetTitle?: string;
    targetArea?: string;
    rating?: number;
    text?: string;
    tags?: string[];
    season?: ReviewSeason;
    groupSize?: ReviewGroupSize;
    visitedAt?: string;
    authorName?: string;
  };
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating må være 1-5" },
      { status: 400 },
    );
  }
  const text = (body.text ?? "").trim();
  if (text.length < 4) {
    return NextResponse.json(
      { error: "Skriv noen ord til" },
      { status: 400 },
    );
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "For lang tekst" }, { status: 400 });
  }
  const targetTitle = (body.targetTitle ?? "").trim();
  if (!targetTitle) {
    return NextResponse.json({ error: "Mangler tur" }, { status: 400 });
  }
  if (
    typeof body.utTripId !== "number" &&
    !(body.tripId && mongoose.isValidObjectId(body.tripId))
  ) {
    return NextResponse.json(
      { error: "Mangler utTripId eller tripId" },
      { status: 400 },
    );
  }
  const season =
    body.season && SEASONS.includes(body.season) ? body.season : undefined;
  const groupSize =
    body.groupSize && GROUP_SIZES.includes(body.groupSize)
      ? body.groupSize
      : undefined;
  const tags = Array.isArray(body.tags)
    ? body.tags
        .map((t) => String(t).trim())
        .filter((t) => t.length > 0 && t.length <= 32)
        .slice(0, 8)
    : [];
  const visitedAt = body.visitedAt ? new Date(body.visitedAt) : undefined;
  await connectToDatabase();
  const doc = await Review.create({
    utTripId: body.utTripId,
    tripId:
      body.tripId && mongoose.isValidObjectId(body.tripId)
        ? new mongoose.Types.ObjectId(body.tripId)
        : undefined,
    targetTitle,
    targetArea: body.targetArea?.trim() || undefined,
    rating,
    text,
    tags,
    season,
    groupSize,
    visitedAt: visitedAt && !Number.isNaN(visitedAt.getTime()) ? visitedAt : undefined,
    authorName: body.authorName?.trim() || undefined,
  });
  return NextResponse.json(serialize(doc), { status: 201 });
}
