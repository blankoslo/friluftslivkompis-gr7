import { NextRequest, NextResponse } from "next/server";
import {
  findAlternatives,
  getCabinAvailability,
  type CabinAvailabilityInfo,
  UtApiError,
} from "@/lib/ut";

export async function POST(req: NextRequest) {
  let body: {
    cabins?: Array<{ utId: number; lat?: number; lon?: number }>;
    persons?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const cabins = Array.isArray(body.cabins) ? body.cabins : [];
  const persons = Math.max(1, Math.round(Number(body.persons) || 1));
  const ids = cabins
    .map((c) => Number(c.utId))
    .filter((id) => Number.isFinite(id));

  if (ids.length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const settled = await Promise.all(
      cabins.map(async (cabin) => {
        const id = Number(cabin.utId);
        if (!Number.isFinite(id)) return null;
        const info = await getCabinAvailability(id, persons, {
          signal: req.signal,
        });
        if (!info) return null;

        let alternatives: CabinAvailabilityInfo[] = [];
        const needsAlternatives =
          info.status === "fullt" || info.bookingOnly;
        if (
          needsAlternatives &&
          typeof cabin.lat === "number" &&
          typeof cabin.lon === "number"
        ) {
          alternatives = await findAlternatives(cabin.lat, cabin.lon, persons, {
            excludeIds: ids,
            limit: 3,
            fetchOptions: { signal: req.signal },
          });
        }

        return { ...info, alternatives };
      }),
    );

    return NextResponse.json({
      results: settled.filter(
        (r): r is CabinAvailabilityInfo & {
          alternatives: CabinAvailabilityInfo[];
        } => r !== null,
      ),
      persons,
    });
  } catch (err) {
    if (err instanceof UtApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status ?? 502 },
      );
    }
    console.error("[/api/cabins/availability] failed", err);
    return NextResponse.json({ error: "availability failed" }, { status: 500 });
  }
}
