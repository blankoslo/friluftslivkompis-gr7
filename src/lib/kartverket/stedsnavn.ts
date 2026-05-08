const STEDSNAVN_URL = "https://ws.geonorge.no/stedsnavn/v1/sted";
const USER_AGENT = "Friluftskompis/1.0 (lag7@blank.no)";

export type PlaceHit = {
  name: string;
  type: string;
  municipality: string | null;
  county: string | null;
  lat: number;
  lon: number;
  stedsnummer: number;
};

type RawHit = {
  navneobjekttype: string;
  representasjonspunkt: { nord: number; øst: number };
  stedsnavn: Array<{
    skrivemåte: string;
    skrivemåtestatus: string;
    navnestatus: string;
  }>;
  kommuner?: Array<{ kommunenavn: string }>;
  fylker?: Array<{ fylkesnavn: string }>;
  stedsnummer: number;
};

type RawResponse = { navn?: RawHit[] };

export type SearchOptions = {
  limit?: number;
  fuzzy?: boolean;
  types?: string[];
  signal?: AbortSignal;
};

export async function searchPlaces(
  query: string,
  opts: SearchOptions = {},
): Promise<PlaceHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    sok: trimmed.endsWith("*") ? trimmed : `${trimmed}*`,
    treffPerSide: String(opts.limit ?? 10),
    fuzzy: String(opts.fuzzy ?? true),
    utkoordsys: "4258",
  });
  if (opts.types?.length) {
    for (const t of opts.types) params.append("navneobjekttype", t);
  }

  const res = await fetch(`${STEDSNAVN_URL}?${params}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: opts.signal,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`stedsnavn ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as RawResponse;

  return (
    data.navn?.map((hit) => {
      const primary =
        hit.stedsnavn.find(
          (n) => n.skrivemåtestatus === "godkjent og prioritert",
        ) ?? hit.stedsnavn[0];
      return {
        name: primary.skrivemåte,
        type: hit.navneobjekttype,
        municipality: hit.kommuner?.[0]?.kommunenavn ?? null,
        county: hit.fylker?.[0]?.fylkesnavn ?? null,
        lat: hit.representasjonspunkt.nord,
        lon: hit.representasjonspunkt["øst"],
        stedsnummer: hit.stedsnummer,
      };
    }) ?? []
  );
}

export const HIKING_PLACE_TYPES = [
  "Fjelltopp",
  "Fjell",
  "Fjellområde",
  "Bre",
  "Vann",
  "Tjern",
  "Nasjonalpark",
  "Tettsted",
  "By",
];
