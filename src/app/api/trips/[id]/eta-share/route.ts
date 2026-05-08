import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type IEtaShare } from "@/models/Trip";

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

interface PostBody {
  contactName?: string;
  contactPhone?: string;
  expectedReturnAt?: string;
  completed?: boolean;
}

function originFromRequest(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  if (!host) return "";
  return `${proto}://${host}`;
}

function publicShape(eta: IEtaShare, origin: string) {
  const path = `/eta/${eta.token}`;
  return {
    token: eta.token,
    enabled: eta.enabled,
    contactName: eta.contactName,
    contactPhone: eta.contactPhone,
    expectedReturnAt: eta.expectedReturnAt.toISOString(),
    createdAt: eta.createdAt.toISOString(),
    completedAt: eta.completedAt ? eta.completedAt.toISOString() : null,
    url: origin ? `${origin}${path}` : path,
    path,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as PostBody;

  const contactName = body.contactName?.trim();
  const expectedISO = body.expectedReturnAt?.trim();
  if (!contactName) {
    return NextResponse.json(
      { error: "contactName required" },
      { status: 400 },
    );
  }
  if (!expectedISO) {
    return NextResponse.json(
      { error: "expectedReturnAt required" },
      { status: 400 },
    );
  }
  const expectedDate = new Date(expectedISO);
  if (Number.isNaN(expectedDate.getTime())) {
    return NextResponse.json(
      { error: "expectedReturnAt must be a valid date" },
      { status: 400 },
    );
  }

  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phone = body.contactPhone?.trim();
  const existing = trip.etaShare as IEtaShare | undefined;
  const token = existing?.token ?? randomBytes(12).toString("hex");

  trip.etaShare = {
    token,
    enabled: true,
    contactName,
    contactPhone: phone || undefined,
    expectedReturnAt: expectedDate,
    createdAt: existing?.createdAt ?? new Date(),
    completedAt: undefined,
  };

  await trip.save();

  const origin = originFromRequest(req);
  return NextResponse.json(publicShape(trip.etaShare as IEtaShare, origin));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as PostBody;

  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const eta = trip.etaShare as IEtaShare | undefined;
  if (!eta) {
    return NextResponse.json(
      { error: "No active eta share" },
      { status: 404 },
    );
  }

  if (body.completed === true) {
    eta.completedAt = new Date();
    eta.enabled = false;
  }
  trip.etaShare = eta;
  await trip.save();

  const origin = originFromRequest(req);
  return NextResponse.json(publicShape(trip.etaShare as IEtaShare, origin));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  trip.etaShare = undefined;
  await trip.save();

  return NextResponse.json({ ok: true });
}
