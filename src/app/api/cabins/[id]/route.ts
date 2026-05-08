import { NextRequest, NextResponse } from "next/server";
import {
  getCabin,
  getCabinFromSnapshot,
  SNAPSHOT_GENERATED_AT,
  SNAPSHOT_SOURCE,
} from "@/lib/ut";

export const revalidate = 86400;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const cabin = await getCabin(id, { signal: req.signal });
    if (cabin) {
      return NextResponse.json(
        { cabin, stale: false, snapshotAt: null },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        },
      );
    }
  } catch (err) {
    console.error("[/api/cabins/:id] upstream failed, trying snapshot", err);
  }

  const fallback = getCabinFromSnapshot(id);
  if (fallback) {
    return NextResponse.json(
      {
        cabin: fallback,
        stale: true,
        snapshotAt: SNAPSHOT_GENERATED_AT,
        snapshotSource: SNAPSHOT_SOURCE,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Data-Source": "snapshot",
        },
      },
    );
  }

  return NextResponse.json({ error: "not found" }, { status: 404 });
}
