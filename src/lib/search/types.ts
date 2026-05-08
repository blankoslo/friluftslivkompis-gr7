export type SearchResult = {
  source: "ut" | "kartverket";
  kind: "area" | "cabin" | "trip" | "poi" | "place";
  id: string;
  name: string;
  lat: number;
  lon: number;
  subtype: string | null;
  municipality: string | null;
  county: string | null;
  dntCabin: boolean | null;
};

export type SearchResponse = {
  results: SearchResult[];
  error?: string;
};

const KIND_LABEL: Record<SearchResult["kind"], string> = {
  area: "Område",
  cabin: "Hytte",
  trip: "Turforslag",
  poi: "POI",
  place: "Sted",
};

const SUBTYPE_OVERRIDE: Record<string, string> = {
  staffed: "Betjent",
  "self-service": "Selvbetjent",
  "no-service": "Ubetjent",
  "emergency shelter": "Nødbu",
  rental: "Utleie",
  "mountain peak": "Fjelltopp",
  "lookout point": "Utsikt",
  bridge: "Bro",
};

export function resultLabel(r: SearchResult): string {
  if (r.kind === "cabin" && r.dntCabin === false) return "Privat hytte";
  if (r.subtype && SUBTYPE_OVERRIDE[r.subtype]) {
    return SUBTYPE_OVERRIDE[r.subtype];
  }
  if (r.kind === "place" && r.subtype) return r.subtype;
  return KIND_LABEL[r.kind];
}

export function resultZoom(r: SearchResult): number {
  switch (r.kind) {
    case "area":
      return 9;
    case "trip":
      return 11;
    case "place":
      return r.subtype === "Tettsted" || r.subtype === "By" ? 11 : 12;
    default:
      return 13;
  }
}
