import { callClaude, ClaudeApiError, extractText } from "./client";
import { LARS_MONSEN_SYSTEM } from "./persona";
import type { TripWeatherSummary } from "@/lib/met/forecast";

export type PackingCategory =
  | "klær"
  | "sove"
  | "mat"
  | "navigasjon"
  | "sikkerhet"
  | "fellesutstyr"
  | "annet";

export interface GeneratedPackingItem {
  name: string;
  category: PackingCategory;
  quantity: number;
  isShared: boolean;
  weightGrams: number;
  reason: string;
}

export interface PackingGenerationInput {
  area: string;
  startDate?: string;
  endDate?: string;
  durationDays: number;
  participantCount: number;
  participantNames: string[];
  weather: TripWeatherSummary | null;
}

const PACKING_SCHEMA = {
  type: "object",
  properties: {
    intro: {
      type: "string",
      description:
        "Én setning fra Lars Monsen-persona som introduserer pakkelisten. Maks 140 tegn.",
    },
    items: {
      type: "array",
      description:
        "Pakkeliste tilpasset vær, varighet og gruppestørrelse. 14-26 elementer.",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Kort navn på utstyret." },
          category: {
            type: "string",
            enum: [
              "klær",
              "sove",
              "mat",
              "navigasjon",
              "sikkerhet",
              "fellesutstyr",
              "annet",
            ],
          },
          quantity: {
            type: "integer",
            description:
              "Antall. Personlig: 1. Mat/dagsporsjoner: dager. Fellesutstyr: 1.",
          },
          isShared: {
            type: "boolean",
            description: "True hvis fellesutstyr som gruppen deler på.",
          },
          weightGrams: {
            type: "integer",
            description:
              "Estimert vekt i gram per enhet (én ting). Realistiske turtall: hodelykt 80, sovepose 1200, telt 2500, gass 230g boks, dagsmat 700.",
          },
          reason: {
            type: "string",
            description:
              "Maks 80 tegn, Monsen-tonen. Hvorfor denne tingen er med.",
          },
        },
        required: [
          "name",
          "category",
          "quantity",
          "isShared",
          "weightGrams",
          "reason",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["intro", "items"],
  additionalProperties: false,
};

export async function generatePackingList(
  input: PackingGenerationInput,
  opts: { signal?: AbortSignal } = {},
): Promise<{ intro: string; items: GeneratedPackingItem[] }> {
  const userPrompt = buildUserPrompt(input);

  const res = await callClaude(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      thinking: { type: "disabled" },
      output_config: {
        format: { type: "json_schema", schema: PACKING_SCHEMA },
        effort: "low",
      },
      system: [
        {
          type: "text",
          text: LARS_MONSEN_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    },
    opts,
  );

  const text = extractText(res);
  if (!text) {
    throw new ClaudeApiError("Claude returned no text content");
  }

  let parsed: { intro: string; items: GeneratedPackingItem[] };
  try {
    parsed = JSON.parse(text) as {
      intro: string;
      items: GeneratedPackingItem[];
    };
  } catch {
    throw new ClaudeApiError(`Failed to parse JSON: ${text.slice(0, 200)}`);
  }

  return parsed;
}

function buildUserPrompt(input: PackingGenerationInput): string {
  const lines: string[] = [];
  lines.push(`Lag pakkeliste for tur til ${input.area || "ukjent område"}.`);
  lines.push(`Varighet: ${input.durationDays} dag(er).`);
  lines.push(
    `Gruppestørrelse: ${input.participantCount} ${input.participantCount === 1 ? "person" : "personer"}.`,
  );
  if (input.participantNames.length > 0) {
    lines.push(`Deltakere: ${input.participantNames.join(", ")}.`);
  }
  if (input.startDate && input.endDate) {
    lines.push(`Periode: ${input.startDate} til ${input.endDate}.`);
  }

  if (input.weather) {
    const w = input.weather;
    lines.push("");
    lines.push("Værvarsel (MET Norway):");
    lines.push(`- Temperatur: ${w.minTempC}°C til ${w.maxTempC}°C.`);
    lines.push(`- Total nedbør: ${w.totalPrecipMm} mm.`);
    lines.push(`- Maks vind: ${w.maxWindMs} m/s.`);
    if (w.dominantSymbol) lines.push(`- Dominerende vær: ${w.dominantSymbol}.`);
  } else {
    lines.push("");
    lines.push("Værvarsel: ikke tilgjengelig. Anta normalt norsk vær for sesongen.");
  }

  lines.push("");
  lines.push("Krav:");
  lines.push("- 14-26 elementer.");
  lines.push("- Skill mellom personlig utstyr og fellesutstyr (isShared=true).");
  lines.push("- Tilpass klær til temperaturen og nedbør.");
  lines.push("- Mengder skal reflektere dager og personer (mat, gass).");
  lines.push("- Ta alltid med kart, kompass, hodelykt og førstehjelp.");
  lines.push("- weightGrams skal være realistisk vekt per enhet.");
  lines.push("- Returner gyldig JSON som matcher schema.");

  return lines.join("\n");
}

export function snapshotKey(input: {
  participantCount: number;
  durationDays: number;
  weather: TripWeatherSummary | null;
}): { weatherKey: string; participantsHash: string; durationDays: number } {
  const w = input.weather;
  const weatherKey = w
    ? `${Math.round(w.minTempC)}|${Math.round(w.maxTempC)}|${Math.round(w.totalPrecipMm)}|${Math.round(w.maxWindMs)}|${w.dominantSymbol ?? ""}`
    : "none";
  return {
    weatherKey,
    participantsHash: String(input.participantCount),
    durationDays: input.durationDays,
  };
}
