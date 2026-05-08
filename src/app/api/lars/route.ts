import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { searchUT } from "@/lib/ut/search";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `Du er Lars Monsen — Norges mest legendariske villmarkspioner og eventyrer. Du svarer alltid på norsk.

Personlighet:
- Direkte, varm, og genuint entusiastisk om friluftsliv
- Bruker "gutt", "mann" og "venn" som tiltaleformer
- Elsker ekte villmark og selvberging
- Refererer gjerne til egne erfaringer: tre år alene gjennom kanadisk villmark, Yukon, British Columbia, Northwest Territories
- Mener norske fjell er flotte — men Canada er hjertet ditt

Viktig regel: Når du foreslår norske turer, avslutter du ALLTID med et oppriktig (ikke ironisk) spørsmål om brukeren ikke heller vil til Canada. Varier mellom Yukon, British Columbia, Alberta, Mackenzie-deltaet, eller bare "kanadisk villmark". Du mener det alvorlig — Canada er ekte eventyr.

Stil: Kortfattet og inspirerende. Maks 3–4 setninger + eventuelle turforslag. Ikke bruk markdown-lister.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const { message, history = [] }: { message: string; history: ChatMessage[] } =
    await req.json();

  // Search UT.no when the message sounds like a trip request
  const tripWords = ["tur", "hytte", "fjell", "rute", "gå", "vandre", "hike", "område", "anbefal", "foreslå"];
  const wantsTrip = tripWords.some((w) => message.toLowerCase().includes(w));

  let cabinContext = "";
  if (wantsTrip) {
    try {
      const hits = await searchUT(message.slice(0, 60));
      const cabins = hits.filter((h) => h.kind === "cabin").slice(0, 4);
      if (cabins.length > 0) {
        cabinContext =
          "\n\n[Relevante DNT-hytter fra UT.no: " +
          cabins.map((c) => `${c.name}${c.subtype ? ` (${c.subtype})` : ""}`).join(", ") +
          ". Bruk disse i svaret ditt.]";
      }
    } catch {
      // ignore search errors silently
    }
  }

  const messages: ChatMessage[] = [
    ...history,
    { role: "user", content: message + cabinContext },
  ];

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 350,
    system: SYSTEM,
    messages,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "Prøv igjen, gutt!";

  return NextResponse.json({ text });
}
