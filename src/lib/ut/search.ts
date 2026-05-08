import { utQuery } from "./client";

export type UtKind = "area" | "cabin" | "trip" | "poi";

export type UtHit = {
  kind: UtKind;
  id: number;
  name: string;
  lat: number;
  lon: number;
  subtype: string | null;
  dntCabin: boolean | null;
  raw: string;
};

const SEARCH_QUERY = /* GraphQL */ `
  query D1Search($q: String!) {
    search(input: { searchString: $q, fullResult: true }) {
      prioritizedResult
      result
    }
  }
`;

type SearchResponse = {
  search: {
    prioritizedResult: string[];
    result: string[];
  };
};

const PREFIX_TO_KIND: Record<string, UtKind | undefined> = {
  a: "area",
  d: "cabin",
  g: "trip",
  e: "poi",
};

export function parseSearchRow(row: string): UtHit | null {
  const parts = row.split(";");
  if (parts.length < 4) return null;
  const kind = PREFIX_TO_KIND[parts[0]];
  if (!kind) return null;

  const id = Number(parts[1]);
  const [lonStr, latStr] = parts[2].split(",");
  const lon = Number(lonStr);
  const lat = Number(latStr);
  if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return {
    kind,
    id,
    name: parts[3],
    lat,
    lon,
    subtype: parts[4] ?? null,
    dntCabin: kind === "cabin" ? parts[5] === "1" : null,
    raw: row,
  };
}

export type UtSearchOptions = {
  signal?: AbortSignal;
  limit?: number;
};

export async function searchUT(
  query: string,
  opts: UtSearchOptions = {},
): Promise<UtHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const data = await utQuery<SearchResponse>(
    SEARCH_QUERY,
    { q: trimmed },
    { signal: opts.signal, revalidate: 3600 },
  );

  const seen = new Set<string>();
  const hits: UtHit[] = [];
  const rows = [...data.search.prioritizedResult, ...data.search.result];

  for (const row of rows) {
    const hit = parseSearchRow(row);
    if (!hit) continue;
    const key = `${hit.kind}:${hit.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push(hit);
    if (opts.limit && hits.length >= opts.limit) break;
  }

  return hits;
}
