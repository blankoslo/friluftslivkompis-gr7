import { callClaude, ClaudeApiError, extractText } from "./client";
import { LARS_MONSEN_SYSTEM } from "./persona";
import type { TripWeatherSummary } from "@/lib/met/forecast";

export type MealType = "frokost" | "lunsj" | "middag" | "snack";

export interface GeneratedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  weightGrams: number;
}

export interface GeneratedMeal {
  type: MealType;
  name: string;
  ingredients: GeneratedIngredient[];
}

export interface GeneratedMealDay {
  dayNumber: number;
  participantsToday: number;
  meals: GeneratedMeal[];
}

export interface GeneratedShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface GeneratedConsumable {
  name: string;
  quantity: number;
  unit: string;
  reason: string;
}

export interface MealPlanGenerationInput {
  area: string;
  durationDays: number;
  participantCount: number;
  participantsPerDay: number[];
  weather: TripWeatherSummary | null;
}

export interface MealPlanGenerationResult {
  intro: string;
  mealPlan: GeneratedMealDay[];
  shoppingList: GeneratedShoppingItem[];
  consumables: GeneratedConsumable[];
}

const MEAL_PLAN_SCHEMA = {
  type: "object",
  properties: {
    intro: {
      type: "string",
      description:
        "Én setning fra Lars Monsen-persona som introduserer matplan + handle. Maks 140 tegn.",
    },
    mealPlan: {
      type: "array",
      description:
        "Matplan per dag. Frokost+lunsj+middag som minimum. Mengder skal multipliseres med participantsToday.",
      items: {
        type: "object",
        properties: {
          dayNumber: { type: "integer" },
          participantsToday: { type: "integer" },
          meals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["frokost", "lunsj", "middag", "snack"],
                },
                name: { type: "string", description: "Måltidets navn." },
                ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      quantity: { type: "number" },
                      unit: {
                        type: "string",
                        description: "g, kg, dl, l, stk, pakke, boks",
                      },
                      category: {
                        type: "string",
                        description:
                          "tørrvarer, ferskvarer, drikke, krydder, tilbehør",
                      },
                      weightGrams: {
                        type: "integer",
                        description: "Total vekt for hele ingrediensmengden i gram.",
                      },
                    },
                    required: [
                      "name",
                      "quantity",
                      "unit",
                      "category",
                      "weightGrams",
                    ],
                    additionalProperties: false,
                  },
                },
              },
              required: ["type", "name", "ingredients"],
              additionalProperties: false,
            },
          },
        },
        required: ["dayNumber", "participantsToday", "meals"],
        additionalProperties: false,
      },
    },
    shoppingList: {
      type: "array",
      description:
        "Aggregert handleliste, summert på tvers av etapper. Én linje per unik vare.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          category: { type: "string" },
        },
        required: ["name", "quantity", "unit", "category"],
        additionalProperties: false,
      },
    },
    consumables: {
      type: "array",
      description:
        "Forbruksvarer utenom mat: gass, batterier, førstehjelp, solkrem, myggspray. Med mengde og begrunnelse.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          reason: { type: "string", description: "Maks 80 tegn." },
        },
        required: ["name", "quantity", "unit", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["intro", "mealPlan", "shoppingList", "consumables"],
  additionalProperties: false,
};

export async function generateMealPlan(
  input: MealPlanGenerationInput,
  opts: { signal?: AbortSignal } = {},
): Promise<MealPlanGenerationResult> {
  const userPrompt = buildPrompt(input);

  const res = await callClaude(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 6144,
      thinking: { type: "disabled" },
      output_config: {
        format: { type: "json_schema", schema: MEAL_PLAN_SCHEMA },
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
  if (!text) throw new ClaudeApiError("Claude returned no text content");

  try {
    return JSON.parse(text) as MealPlanGenerationResult;
  } catch {
    throw new ClaudeApiError(`Failed to parse meal plan JSON: ${text.slice(0, 200)}`);
  }
}

function buildPrompt(input: MealPlanGenerationInput): string {
  const lines: string[] = [];
  lines.push(`Lag matplan + handleliste + forbruksvareliste for tur til ${input.area || "ukjent område"}.`);
  lines.push(`Varighet: ${input.durationDays} dag(er). Totalt ${input.participantCount} personer.`);
  if (input.participantsPerDay.length > 0) {
    const perDay = input.participantsPerDay
      .map((n, i) => `dag ${i + 1}: ${n}`)
      .join(", ");
    lines.push(`Deltakere per dag: ${perDay}.`);
  }
  if (input.weather) {
    const w = input.weather;
    lines.push("");
    lines.push("Værvarsel:");
    lines.push(`- Temperatur ${w.minTempC}°C til ${w.maxTempC}°C, nedbør ${w.totalPrecipMm} mm.`);
  }
  lines.push("");
  lines.push("Krav:");
  lines.push("- Friluftsmat: enkel, høy energi, lav vekt. Tørrvarer prioriteres.");
  lines.push("- Frokost + lunsj + middag hver dag, snacks der det passer.");
  lines.push("- Skaler ingrediensmengder med participantsToday for hver dag.");
  lines.push("- shoppingList skal summere alle ingredienser på tvers av etapper.");
  lines.push("- consumables: gass beregnet i gram (~50g/person/dag), batterier, førstehjelp, solkrem etter sesong.");
  lines.push("- weightGrams er total vekt for ingrediensmengden, ikke per enhet.");
  lines.push("- Returner gyldig JSON som matcher schema.");
  return lines.join("\n");
}
