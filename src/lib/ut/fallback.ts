import snapshotJson from "../../../data/snapshots/dnt-cabins.json";
import type { Cabin } from "./hydrate";
import type { CabinListItem } from "./cabins";
import type { UtHit } from "./search";

type SnapshotShape = {
  generatedAt: string;
  source: string;
  count: number;
  cabins: Cabin[];
};

const snapshot = snapshotJson as SnapshotShape;
const byId = new Map<number, Cabin>();
for (const c of snapshot.cabins) byId.set(c.id, c);

export const SNAPSHOT_GENERATED_AT = snapshot.generatedAt;
export const SNAPSHOT_SOURCE = snapshot.source;
export const SNAPSHOT_COUNT = snapshot.cabins.length;

export function snapshotAgeDays(now: Date = new Date()): number {
  const generated = new Date(SNAPSHOT_GENERATED_AT).getTime();
  return Math.max(0, (now.getTime() - generated) / 86_400_000);
}

export function getCabinFromSnapshot(id: number): Cabin | null {
  return byId.get(id) ?? null;
}

export function listCabinsFromSnapshot(): CabinListItem[] {
  const out: CabinListItem[] = [];
  for (const c of snapshot.cabins) {
    const coords = c.geojson?.coordinates;
    if (!coords || coords.length < 2) continue;
    out.push({
      id: c.id,
      name: c.name,
      serviceLevel: c.serviceLevel,
      dntCabin: c.dntCabin,
      bedsStaffed: c.bedsStaffed,
      bedsSelfService: c.bedsSelfService,
      bedsNoService: c.bedsNoService,
      bedsExtra: c.bedsExtra,
      bedsWinter: c.bedsWinter,
      lon: coords[0],
      lat: coords[1],
    });
  }
  return out;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

export function searchCabinsInSnapshot(query: string, limit = 15): UtHit[] {
  const q = normalize(query.trim());
  if (q.length < 3) return [];

  const hits: UtHit[] = [];
  for (const c of snapshot.cabins) {
    if (!normalize(c.name).includes(q)) continue;
    const coords = c.geojson?.coordinates;
    if (!coords || coords.length < 2) continue;
    hits.push({
      kind: "cabin",
      id: c.id,
      name: c.name,
      lat: coords[1],
      lon: coords[0],
      subtype: c.serviceLevel,
      dntCabin: c.dntCabin,
      raw: `d;${c.id};${coords[0]},${coords[1]};${c.name};${c.serviceLevel ?? ""};${c.dntCabin ? "1" : "0"}`,
    });
    if (hits.length >= limit) break;
  }
  return hits;
}
