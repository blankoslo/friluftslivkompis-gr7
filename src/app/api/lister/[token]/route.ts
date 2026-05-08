import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SavedList, type ISavedListItem } from "@/models/SavedList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

function serialize(doc: {
  _id: unknown;
  name: string;
  description?: string;
  shareToken: string;
  ownerName?: string;
  items: ISavedListItem[];
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description ?? "",
    shareToken: doc.shareToken,
    ownerName: doc.ownerName ?? "",
    items: (doc.items ?? []).map((it) => ({
      id: String(it._id ?? ""),
      utTripId: it.utTripId,
      tripId: it.tripId ? String(it.tripId) : undefined,
      title: it.title,
      area: it.area,
      lat: it.lat,
      lon: it.lon,
      imageUrl: it.imageUrl,
      note: it.note,
      addedAt: it.addedAt,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(_req: Request, { params }: Props) {
  const { token } = await params;
  await connectToDatabase();
  const doc = await SavedList.findOne({ shareToken: token }).lean();
  if (!doc) {
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }
  return NextResponse.json(serialize(doc));
}

export async function POST(req: Request, { params }: Props) {
  const { token } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    utTripId?: number;
    tripId?: string;
    title?: string;
    area?: string;
    lat?: number;
    lon?: number;
    imageUrl?: string;
    note?: string;
  };
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Mangler tittel" }, { status: 400 });
  }
  await connectToDatabase();
  const doc = await SavedList.findOne({ shareToken: token });
  if (!doc) {
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }
  const exists =
    typeof body.utTripId === "number" &&
    doc.items.some((it: ISavedListItem) => it.utTripId === body.utTripId);
  if (exists) {
    return NextResponse.json(serialize(doc.toObject()));
  }
  doc.items.push({
    utTripId: body.utTripId,
    title: body.title.trim(),
    area: body.area?.trim() || undefined,
    lat: body.lat,
    lon: body.lon,
    imageUrl: body.imageUrl,
    note: body.note?.trim() || undefined,
    addedAt: new Date(),
  });
  await doc.save();
  return NextResponse.json(serialize(doc.toObject()));
}

export async function DELETE(req: Request, { params }: Props) {
  const { token } = await params;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json({ error: "Mangler itemId" }, { status: 400 });
  }
  await connectToDatabase();
  const doc = await SavedList.findOne({ shareToken: token });
  if (!doc) {
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }
  doc.items = doc.items.filter(
    (it: ISavedListItem) => String(it._id) !== itemId,
  );
  await doc.save();
  return NextResponse.json(serialize(doc.toObject()));
}
