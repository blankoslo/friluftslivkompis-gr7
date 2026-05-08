export type KartverketLayer = "topo" | "topograatone" | "toporaster";

export const KARTVERKET_ATTRIBUTION =
  '<a href="https://www.kartverket.no/" target="_blank" rel="noreferrer">© Kartverket</a>';

export function tileUrl(layer: KartverketLayer = "topo"): string {
  return `https://cache.kartverket.no/v1/wmts/1.0.0/${layer}/default/webmercator/{z}/{y}/{x}.png`;
}

export function rasterSource(layer: KartverketLayer = "topo") {
  return {
    type: "raster" as const,
    tiles: [tileUrl(layer)],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 18,
    attribution: KARTVERKET_ATTRIBUTION,
  };
}
