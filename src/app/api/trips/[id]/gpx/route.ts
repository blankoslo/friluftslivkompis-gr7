import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITripCabin } from "@/models/Trip";
import { buildGpx, gpxFilename, type GpxCabin } from "@/lib/gpx";

const DEMO_CABINS: GpxCabin[] = [
  { name: "Gjendesheim", lat: 61.4945, lon: 8.8108 },
  { name: "Memurubu", lat: 61.535, lon: 8.602 },
  { name: "Glitterheim", lat: 61.6385, lon: 8.5418 },
  { name: "Spiterstulen", lat: 61.6232, lon: 8.4136 },
];

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let title: string;
  let area: string | undefined;
  let cabins: GpxCabin[];
  let startIso: string | undefined;

  if (id === "demo") {
    title = "Demo - Jotunheim-runden";
    area = "Jotunheimen";
    cabins = DEMO_CABINS;
    startIso = undefined;
  } else {
    await connectToDatabase();
    const doc = await Trip.findOne(tripQuery(id)).lean<{
      title: string;
      area?: string;
      startDate?: Date;
      cabins?: ITripCabin[];
    } | null>();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!doc.cabins || doc.cabins.length < 2) {
      return NextResponse.json(
        { error: "Turen har ingen rute. Legg til minst to hytter først." },
        { status: 400 },
      );
    }
    title = doc.title;
    area = doc.area;
    cabins = doc.cabins.map((c) => ({ name: c.name, lat: c.lat, lon: c.lon }));
    startIso = doc.startDate?.toISOString();
  }

  const gpx = buildGpx({
    name: title,
    description: area ? `${area} - eksportert fra Friluftskompis` : "Eksportert fra Friluftskompis",
    cabins,
    startTimeIso: startIso,
  });

  return new NextResponse(gpx, {
    status: 200,
    headers: {
      "Content-Type": "application/gpx+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${gpxFilename(title)}"`,
      "Cache-Control": "no-store",
    },
  });
}
