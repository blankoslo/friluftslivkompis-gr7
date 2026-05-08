import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type IEtaShare } from "@/models/Trip";
import { computeEtaStatus } from "@/lib/eta/status";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  await connectToDatabase();
  const { token } = await params;

  const doc = await Trip.findOne({ "etaShare.token": token }).lean<{
    title: string;
    area?: string;
    etaShare?: IEtaShare;
  } | null>();

  if (!doc?.etaShare) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const eta = doc.etaShare;
  const status = computeEtaStatus({
    expectedReturnAt: new Date(eta.expectedReturnAt),
    now: new Date(),
    completedAt: eta.completedAt ? new Date(eta.completedAt) : null,
  });

  return NextResponse.json({
    tripTitle: doc.title,
    tripArea: doc.area ?? "",
    contactName: eta.contactName,
    expectedReturnAt: new Date(eta.expectedReturnAt).toISOString(),
    enabled: eta.enabled,
    completedAt: eta.completedAt
      ? new Date(eta.completedAt).toISOString()
      : null,
    status: status.status,
    delayMinutes: status.delayMinutes,
  });
}
