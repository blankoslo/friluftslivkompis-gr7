import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type ITripCabin, type IParticipant } from "@/models/Trip";
import {
  getCabin,
  getCabinFromSnapshot,
  serviceLevelLabel,
  totalBeds,
  type Cabin,
} from "@/lib/ut";
import { assessAvailability } from "@/lib/ut/availability";
import { haversineKm } from "@/lib/route";
import {
  generateCabinComparison,
  type CompareCabinFacts,
  type CompareMissingField,
} from "@/lib/claude/cabin-compare";

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

async function hydrate(
  cabin: ITripCabin,
  signal: AbortSignal,
): Promise<{ data: Cabin | null; stale: boolean }> {
  if (!cabin.utId) return { data: null, stale: false };
  try {
    const live = await getCabin(cabin.utId, { signal });
    if (live) return { data: live, stale: false };
  } catch (err) {
    console.error("[compare] live cabin fetch failed", cabin.utId, err);
  }
  const snap = getCabinFromSnapshot(cabin.utId);
  return { data: snap, stale: Boolean(snap) };
}

function buildFacts(
  tripCabin: ITripCabin,
  hydrated: Cabin | null,
  prev: ITripCabin | null,
  next: ITripCabin | null,
  persons: number,
): CompareCabinFacts {
  const missing: CompareMissingField[] = [];
  missing.push("pris");

  const total = hydrated ? totalBeds(hydrated) : null;
  if (!hydrated || (total ?? 0) === 0) missing.push("kapasitet");
  if (!hydrated?.serviceLevel) missing.push("betjening");

  const distanceFromPrev = prev
    ? haversineKm(
        { lat: prev.lat, lon: prev.lon },
        { lat: tripCabin.lat, lon: tripCabin.lon },
      )
    : null;
  const distanceToNext = next
    ? haversineKm(
        { lat: tripCabin.lat, lon: tripCabin.lon },
        { lat: next.lat, lon: next.lon },
      )
    : null;
  if (distanceFromPrev === null && distanceToNext === null) {
    missing.push("beliggenhet");
  }

  let availabilityStatus: "ledig" | "fullt" | "ukjent" | null = null;
  if (hydrated) {
    const a = assessAvailability(
      {
        id: hydrated.id,
        name: hydrated.name,
        dntCabin: hydrated.dntCabin,
        serviceLevel: hydrated.serviceLevel,
        bedsStaffed: hydrated.bedsStaffed,
        bedsSelfService: hydrated.bedsSelfService,
        bedsNoService: hydrated.bedsNoService,
        bookingEnabled: null,
        bookingOnly: false,
        bookingUrl: null,
        geojson: null,
      },
      persons,
    );
    availabilityStatus = a.status;
  }

  return {
    utId: tripCabin.utId ?? 0,
    name: tripCabin.name,
    serviceLevelLabel: serviceLevelLabel(hydrated?.serviceLevel ?? null),
    totalBeds: total,
    bedsStaffed: hydrated?.bedsStaffed ?? null,
    bedsSelfService: hydrated?.bedsSelfService ?? null,
    bedsNoService: hydrated?.bedsNoService ?? null,
    dntCabin: hydrated?.dntCabin === true,
    bookingOnly: false,
    description: hydrated?.description ?? null,
    distanceFromPrevKm: distanceFromPrev,
    distanceToNextKm: distanceToNext,
    availabilityStatus,
    missingFields: missing,
    priceNote: "Mangler i kilden (UT.no oppgir ikke pris).",
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;

  const trip = await Trip.findOne(tripQuery(id)).lean<{
    _id: mongoose.Types.ObjectId;
    title: string;
    area?: string;
    startDate?: Date;
    endDate?: Date;
    cabins?: ITripCabin[];
    participants?: IParticipant[];
  } | null>();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cabins = trip.cabins ?? [];
  if (cabins.length < 2) {
    return NextResponse.json(
      { error: "Trenger minst to hytter for sammenligning." },
      { status: 400 },
    );
  }

  const persons = Math.max(1, trip.participants?.length ?? 1);

  const hydrated = await Promise.all(
    cabins.map((c) => hydrate(c, req.signal)),
  );
  const anyStale = hydrated.some((h) => h.stale);

  const facts: CompareCabinFacts[] = cabins.map((c, i) =>
    buildFacts(
      c,
      hydrated[i].data,
      i > 0 ? cabins[i - 1] : null,
      i < cabins.length - 1 ? cabins[i + 1] : null,
      persons,
    ),
  );

  try {
    const result = await generateCabinComparison(
      {
        area: trip.area ?? "",
        participants: persons,
        startDate: trip.startDate?.toISOString().slice(0, 10) ?? null,
        endDate: trip.endDate?.toISOString().slice(0, 10) ?? null,
        cabins: facts,
      },
      { signal: req.signal },
    );

    return NextResponse.json({
      result,
      facts,
      stale: anyStale,
    });
  } catch (err) {
    console.error("[compare] claude failed", err);
    return NextResponse.json(
      { error: "AI-sammenligning feilet. Prøv igjen om litt." },
      { status: 502 },
    );
  }
}
