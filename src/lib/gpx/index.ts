export type GpxCabin = {
  name: string;
  lat: number;
  lon: number;
};

export type BuildGpxInput = {
  name: string;
  description?: string;
  cabins: GpxCabin[];
  startTimeIso?: string;
};

const CREATOR = "Friluftskompis";
const SCHEMA = "http://www.topografix.com/GPX/1/1";
const SCHEMA_LOCATION =
  "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmtCoord(value: number): string {
  return value.toFixed(6);
}

export function buildGpx(input: BuildGpxInput): string {
  const { name, description, cabins, startTimeIso } = input;
  const safeName = escapeXml(name);
  const time = startTimeIso ?? new Date().toISOString();

  const waypoints = cabins
    .map((c, i) => {
      const wpName = escapeXml(c.name);
      const sym = i === 0 ? "Trailhead" : i === cabins.length - 1 ? "Flag" : "Lodge";
      return [
        `  <wpt lat="${fmtCoord(c.lat)}" lon="${fmtCoord(c.lon)}">`,
        `    <name>${wpName}</name>`,
        `    <sym>${sym}</sym>`,
        `    <type>Hytte</type>`,
        `  </wpt>`,
      ].join("\n");
    })
    .join("\n");

  const routePoints = cabins
    .map(
      (c) =>
        `      <rtept lat="${fmtCoord(c.lat)}" lon="${fmtCoord(c.lon)}"><name>${escapeXml(c.name)}</name></rtept>`,
    )
    .join("\n");

  const trackPoints = cabins
    .map((c) => `        <trkpt lat="${fmtCoord(c.lat)}" lon="${fmtCoord(c.lon)}"></trkpt>`)
    .join("\n");

  const desc = description
    ? `\n    <desc>${escapeXml(description)}</desc>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${CREATOR}" xmlns="${SCHEMA}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${SCHEMA_LOCATION}">
  <metadata>
    <name>${safeName}</name>${desc}
    <time>${time}</time>
  </metadata>
${waypoints}
  <rte>
    <name>${safeName}</name>
${routePoints}
  </rte>
  <trk>
    <name>${safeName}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>
`;
}

export function gpxFilename(tripName: string): string {
  const slug =
    tripName
      .toLowerCase()
      .replace(/[æå]/g, "a")
      .replace(/ø/g, "o")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "tur";
  return `${slug}.gpx`;
}
