import { callClaude, ClaudeApiError, extractText } from "./client";
import { LARS_MONSEN_SYSTEM } from "./persona";

export type CompareMissingField = "pris" | "kapasitet" | "beliggenhet" | "betjening";

export interface CompareCabinFacts {
  utId: number;
  name: string;
  serviceLevelLabel: string;
  totalBeds: number | null;
  bedsStaffed: number | null;
  bedsSelfService: number | null;
  bedsNoService: number | null;
  dntCabin: boolean;
  bookingOnly: boolean;
  description: string | null;
  distanceFromPrevKm: number | null;
  distanceToNextKm: number | null;
  availabilityStatus: "ledig" | "fullt" | "ukjent" | null;
  missingFields: CompareMissingField[];
  priceNote: string;
}

export interface CabinSummary {
  utId: number;
  name: string;
  oneLiner: string;
  capacityNote: string;
  locationNote: string;
  distinctive: string;
  missingFields: CompareMissingField[];
}

export interface CabinRecommendation {
  utId: number;
  reason: string;
}

export interface CompareResult {
  summaries: CabinSummary[];
  recommendation: CabinRecommendation;
  intro: string;
}

const COMPARE_SCHEMA = {
  type: "object",
  properties: {
    intro: {
      type: "string",
      description:
        "Én setning Lars Monsen-tone som setter scenen for sammenligningen. Maks 140 tegn.",
    },
    summaries: {
      type: "array",
      description: "Én oppsummering per hytte i samme rekkefølge som input.",
      items: {
        type: "object",
        properties: {
          utId: { type: "integer" },
          name: { type: "string" },
          oneLiner: {
            type: "string",
            description:
              "Maks 90 tegn, Monsen-tonen, oppsummerer hva som kjennetegner hytta.",
          },
          capacityNote: {
            type: "string",
            description:
              "Kort tekst om sengeplasser. Hvis kapasitet mangler, skriv 'Mangler sengedata.'",
          },
          locationNote: {
            type: "string",
            description:
              "Kort tekst om beliggenhet relativt til ruten (avstand fra forrige/neste etappe i km hvis tilgjengelig).",
          },
          distinctive: {
            type: "string",
            description:
              "Maks 120 tegn. Hva som skiller denne hytta fra de andre i lista. Bruk faktiske data, ikke gjett.",
          },
          missingFields: {
            type: "array",
            items: {
              type: "string",
              enum: ["pris", "kapasitet", "beliggenhet", "betjening"],
            },
            description:
              "Kopier missingFields fra input. Aldri legg til felter som ikke står der.",
          },
        },
        required: [
          "utId",
          "name",
          "oneLiner",
          "capacityNote",
          "locationNote",
          "distinctive",
          "missingFields",
        ],
        additionalProperties: false,
      },
    },
    recommendation: {
      type: "object",
      properties: {
        utId: {
          type: "integer",
          description: "utId på hytta som passer gruppen best.",
        },
        reason: {
          type: "string",
          description:
            "Maks 200 tegn, Monsen-tone. Konkret begrunnelse basert på data: kapasitet, plassering i ruten, betjeningsnivå, ledighet. Aldri spekuler om pris.",
        },
      },
      required: ["utId", "reason"],
      additionalProperties: false,
    },
  },
  required: ["intro", "summaries", "recommendation"],
  additionalProperties: false,
};

export interface CompareGenerationInput {
  area: string;
  participants: number;
  startDate?: string | null;
  endDate?: string | null;
  cabins: CompareCabinFacts[];
}

export async function generateCabinComparison(
  input: CompareGenerationInput,
  opts: { signal?: AbortSignal } = {},
): Promise<CompareResult> {
  const userPrompt = buildPrompt(input);

  const res = await callClaude(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      thinking: { type: "disabled" },
      output_config: {
        format: { type: "json_schema", schema: COMPARE_SCHEMA },
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
  if (!text) throw new ClaudeApiError("Claude returned no text");

  let parsed: CompareResult;
  try {
    parsed = JSON.parse(text) as CompareResult;
  } catch {
    throw new ClaudeApiError(`Failed to parse JSON: ${text.slice(0, 200)}`);
  }
  return parsed;
}

function buildPrompt(input: CompareGenerationInput): string {
  const lines: string[] = [];
  lines.push(
    `Sammenlign ${input.cabins.length} hytter for tur til ${input.area || "ukjent område"}.`,
  );
  lines.push(`Gruppestørrelse: ${input.participants}.`);
  if (input.startDate) {
    lines.push(
      `Periode: ${input.startDate}${input.endDate ? ` til ${input.endDate}` : ""}.`,
    );
  }
  lines.push("");
  lines.push("Faktabokser per hytte (ren data, ikke endre):");
  for (let i = 0; i < input.cabins.length; i++) {
    const c = input.cabins[i];
    lines.push(`--- Hytte ${i + 1}: ${c.name} (utId ${c.utId}) ---`);
    lines.push(`- Betjening: ${c.serviceLevelLabel}`);
    lines.push(
      `- Senger totalt: ${c.totalBeds ?? "ukjent"} (betjent ${c.bedsStaffed ?? 0}, selvbetjent ${c.bedsSelfService ?? 0}, ubetjent ${c.bedsNoService ?? 0}).`,
    );
    lines.push(`- DNT-hytte: ${c.dntCabin ? "ja" : "nei"}.`);
    if (c.bookingOnly) lines.push("- Krever forhåndsbestilling.");
    if (c.distanceFromPrevKm !== null) {
      lines.push(
        `- Avstand fra forrige etappe: ${c.distanceFromPrevKm.toFixed(1)} km.`,
      );
    }
    if (c.distanceToNextKm !== null) {
      lines.push(
        `- Avstand til neste etappe: ${c.distanceToNextKm.toFixed(1)} km.`,
      );
    }
    if (c.availabilityStatus) {
      lines.push(`- Ledighet: ${c.availabilityStatus}.`);
    }
    lines.push(`- Pris: ${c.priceNote}`);
    if (c.description) {
      const desc = c.description.replace(/\s+/g, " ").slice(0, 280);
      lines.push(`- Beskrivelse: ${desc}`);
    }
    if (c.missingFields.length > 0) {
      lines.push(`- Manglende felter: ${c.missingFields.join(", ")}.`);
    }
  }
  lines.push("");
  lines.push("Krav:");
  lines.push("- Bruk kun fakta som står over. Aldri dikt opp tall eller priser.");
  lines.push(
    "- Velg én vinner på recommendation. Begrunn med kapasitet, plassering eller betjening, ikke pris (UT.no har ikke prisdata).",
  );
  lines.push(
    "- For hver hytte: kopier missingFields nøyaktig fra input. Hvis pris mangler hos alle, nevn det i intro i stedet for å gjenta.",
  );
  lines.push("- Distinctive må peke på en faktisk forskjell, ikke generisk skryt.");
  lines.push("- Returner gyldig JSON som matcher schema.");
  return lines.join("\n");
}
