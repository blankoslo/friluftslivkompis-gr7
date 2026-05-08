import { NextRequest, NextResponse } from "next/server";
import { getCabin } from "@/lib/ut";

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
    if (!cabin) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(
      { cabin },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (err) {
    console.error("[/api/cabins/:id]", err);
    return NextResponse.json(
      { error: "cabin upstream failed" },
      { status: 502 },
    );
  }
}
