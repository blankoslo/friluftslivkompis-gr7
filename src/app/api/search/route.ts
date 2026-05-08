import { NextRequest, NextResponse } from "next/server";
import { HIKING_PLACE_TYPES, searchPlaces } from "@/lib/kartverket";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "10");
  const onlyHiking = req.nextUrl.searchParams.get("hiking") === "true";

  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchPlaces(q, {
      limit: Math.min(Math.max(limit, 1), 50),
      types: onlyHiking ? HIKING_PLACE_TYPES : undefined,
      signal: req.signal,
    });
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json(
      { error: "search upstream failed", results: [] },
      { status: 502 },
    );
  }
}
