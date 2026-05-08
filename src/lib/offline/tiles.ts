import type { KartverketLayer } from "@/lib/kartverket";

export type Bbox = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

export type TilePrecachePlan = {
  urls: string[];
  count: number;
  zoomRange: [number, number];
  bbox: Bbox;
};

const MAX_TILES = 1500;

export function lon2tile(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

export function lat2tile(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z,
  );
}

export function bboxFromCoords(
  coords: Array<[number, number] | [number, number, number]>,
): Bbox | null {
  if (coords.length === 0) return null;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const c of coords) {
    const [lon, lat] = c;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLon, minLat, maxLon, maxLat };
}

export function padBbox(bbox: Bbox, paddingDeg: number): Bbox {
  return {
    minLon: bbox.minLon - paddingDeg,
    maxLon: bbox.maxLon + paddingDeg,
    minLat: bbox.minLat - paddingDeg,
    maxLat: bbox.maxLat + paddingDeg,
  };
}

export function tileUrlsForBbox(
  bbox: Bbox,
  minZoom: number,
  maxZoom: number,
  layer: KartverketLayer = "topo",
): string[] {
  const urls: string[] = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = lon2tile(bbox.minLon, z);
    const xMax = lon2tile(bbox.maxLon, z);
    const yMin = lat2tile(bbox.maxLat, z);
    const yMax = lat2tile(bbox.minLat, z);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        urls.push(
          `https://cache.kartverket.no/v1/wmts/1.0.0/${layer}/default/webmercator/${z}/${y}/${x}.png`,
        );
      }
    }
  }
  return urls;
}

export function planPrecache(
  bbox: Bbox,
  layer: KartverketLayer = "topo",
): TilePrecachePlan {
  const padded = padBbox(bbox, 0.05);
  for (let maxZ = 13; maxZ >= 8; maxZ--) {
    const urls = tileUrlsForBbox(padded, 8, maxZ, layer);
    if (urls.length <= MAX_TILES) {
      return {
        urls,
        count: urls.length,
        zoomRange: [8, maxZ],
        bbox: padded,
      };
    }
  }
  const fallback = tileUrlsForBbox(padded, 8, 8, layer);
  return {
    urls: fallback,
    count: fallback.length,
    zoomRange: [8, 8],
    bbox: padded,
  };
}
