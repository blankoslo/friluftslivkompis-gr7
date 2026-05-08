const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function interpolatePoints(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  steps: number,
): Array<{ lat: number; lon: number }> {
  const out: Array<{ lat: number; lon: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push({
      lat: a.lat + (b.lat - a.lat) * t,
      lon: a.lon + (b.lon - a.lon) * t,
    });
  }
  return out;
}

export function naismithHours(distanceKm: number, elevationGainM: number): number {
  return distanceKm / 4 + elevationGainM / 600;
}
