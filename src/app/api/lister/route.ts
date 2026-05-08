import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SavedList } from "@/models/SavedList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeToken(): string {
  return randomBytes(8).toString("base64url");
}

export async function GET() {
  await connectToDatabase();
  const docs = await SavedList.find()
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean<
      {
        _id: unknown;
        name: string;
        description?: string;
        shareToken: string;
        ownerName?: string;
        items: { title: string }[];
        updatedAt: Date;
      }[]
    >();
  return NextResponse.json(
    docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      description: d.description ?? "",
      shareToken: d.shareToken,
      ownerName: d.ownerName ?? "",
      itemCount: (d.items ?? []).length,
      updatedAt: d.updatedAt,
    })),
  );
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    ownerName?: string;
    item?: {
      utTripId?: number;
      tripId?: string;
      title: string;
      area?: string;
      lat?: number;
      lon?: number;
      imageUrl?: string;
      note?: string;
    };
  };
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Mangler navn" }, { status: 400 });
  }
  await connectToDatabase();
  const initialItems = body.item
    ? [
        {
          ...body.item,
          addedAt: new Date(),
        },
      ]
    : [];
  const doc = await SavedList.create({
    name,
    description: body.description?.trim() || undefined,
    ownerName: body.ownerName?.trim() || undefined,
    shareToken: makeToken(),
    items: initialItems,
  });
  return NextResponse.json(
    {
      id: String(doc._id),
      name: doc.name,
      shareToken: doc.shareToken,
    },
    { status: 201 },
  );
}
