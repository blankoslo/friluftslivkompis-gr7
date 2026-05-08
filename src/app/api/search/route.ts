import { NextRequest, NextResponse } from "next/server";
import { HIKING_PLACE_TYPES, searchPlaces, type PlaceHit } from "@/lib/kartverket";
import {
  searchUT,
  searchCabinsInSnapshot,
  SNAPSHOT_GENERATED_AT,
  type UtHit,
} from "@/lib/ut";
import type { SearchResult } from "@/lib/search/types";

function fromUt(hit: UtHit, stale = false): SearchResult {
  return {
    source: "ut",
    kind: hit.kind,
    id: `ut:${hit.kind}:${hit.id}`,
    name: hit.name,
    lat: hit.lat,
    lon: hit.lon,
    subtype: hit.subtype,
    municipality: null,
    county: null,
    dntCabin: hit.dntCabin,
    stale,
  };
}

function fromKartverket(hit: PlaceHit): SearchResult {
  return {
    source: "kartverket",
    kind: "place",
    id: `kv:${hit.stedsnummer}`,
    name: hit.name,
    lat: hit.lat,
    lon: hit.lon,
    subtype: hit.type,
    municipality: hit.municipality,
    county: hit.county,
    dntCabin: null,
    stale: false,
  };
}

function normalize(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
}

function isNearDup(a: SearchResult, b: SearchResult) {
  if (normalize(a.name) !== normalize(b.name)) return false;
  return Math.abs(a.lat - b.lat) < 0.02 && Math.abs(a.lon - b.lon) < 0.02;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get("limit") ?? "15"), 1),
    50,
  );

  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const [utRes, kvRes] = await Promise.allSettled([
    searchUT(q, { signal: req.signal, limit }),
    searchPlaces(q, {
      limit,
      types: HIKING_PLACE_TYPES,
      signal: req.signal,
    }),
  ]);

  if (utRes.status === "rejected") {
    console.error("[/api/search] ut.no failed", utRes.reason);
  }
  if (kvRes.status === "rejected") {
    console.error("[/api/search] kartverket failed", kvRes.reason);
  }

  const utFailed = utRes.status === "rejected";
  const utHits =
    utRes.status === "fulfilled" ? utRes.value.map((h) => fromUt(h, false)) : [];
  const kvHits =
    kvRes.status === "fulfilled" ? kvRes.value.map(fromKartverket) : [];

  const fallbackUtHits = utFailed
    ? searchCabinsInSnapshot(q, limit).map((h) => fromUt(h, true))
    : [];

  if (utFailed && kvRes.status === "rejected" && fallbackUtHits.length === 0) {
    return NextResponse.json(
      { error: "search upstream failed", results: [], stale: false },
      { status: 502 },
    );
  }

  const merged: SearchResult[] = [...utHits, ...fallbackUtHits];
  for (const hit of kvHits) {
    if (merged.some((existing) => isNearDup(existing, hit))) continue;
    merged.push(hit);
  }

  const anyStale = merged.some((r) => r.stale);

  return NextResponse.json(
    {
      results: merged.slice(0, limit),
      stale: anyStale,
      snapshotAt: anyStale ? SNAPSHOT_GENERATED_AT : null,
    },
    {
      headers: anyStale
        ? { "Cache-Control": "no-store", "X-Data-Source": "snapshot" }
        : {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=86400",
          },
    },
  );
}
