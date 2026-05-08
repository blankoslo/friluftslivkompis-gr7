import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type IEmergencyContact, type EmergencyRole } from "@/models/Trip";

const ROLES: EmergencyRole[] = [
  "turleder",
  "pårørende",
  "fastlege",
  "forsikring",
  "annet",
];

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

interface ContactPatch {
  _id?: string;
  name?: string;
  phone?: string;
  role?: string;
  note?: string;
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, "").trim();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json()) as { contacts?: ContactPatch[] };
  if (!Array.isArray(body.contacts)) {
    return NextResponse.json({ error: "contacts required" }, { status: 400 });
  }

  const trip = await Trip.findOne(tripQuery(id));
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cleaned: IEmergencyContact[] = [];
  for (const c of body.contacts) {
    const name = c.name?.trim();
    const phone = c.phone ? normalizePhone(c.phone) : "";
    if (!name || !phone) continue;
    const role: EmergencyRole = ROLES.includes(c.role as EmergencyRole)
      ? (c.role as EmergencyRole)
      : "annet";
    const next: Partial<IEmergencyContact> & {
      name: string;
      phone: string;
      role: EmergencyRole;
    } = { name, phone, role };
    if (c.note?.trim()) next.note = c.note.trim();
    if (c._id && mongoose.isValidObjectId(c._id)) {
      (next as { _id?: mongoose.Types.ObjectId })._id =
        new mongoose.Types.ObjectId(c._id);
    }
    cleaned.push(next as IEmergencyContact);
  }

  trip.emergencyContacts = cleaned;
  await trip.save();

  return NextResponse.json({
    contacts: trip.emergencyContacts.map((c: IEmergencyContact) => ({
      _id: c._id?.toString(),
      name: c.name,
      phone: c.phone,
      role: c.role,
      note: c.note,
    })),
  });
}
