export type QuipCategory =
  | "tripSelect"
  | "cabinSelect"
  | "searchEmpty"
  | "homeWisdom"
  | "packingIntro"
  | "timelineEmpty"
  | "noParticipants"
  | "expenses"
  | "discoverHero"
  | "filterEmpty"
  | "loading";

const QUIPS: Record<QuipCategory, string[]> = {
  tripSelect: [
    "Er du sikker på at du ikke vil ta Canada på tvers? Det er bare 6 000 km.",
    "Helt grei tur. Hvis du legger på 1000 km, blir det interessant.",
    "Den der gikk jeg som femåring. Med ski på beina og pulken etter.",
    "Pent valg. Men en bjørn kunne klart den fortere.",
    "Skal du på dagstur? Jeg pakker det i lommene.",
    "Greit utgangspunkt. Sving innom Finnmarksvidda på vei tilbake.",
    "Husk: kompasset viser ikke nord, det viser meg.",
    "Du kunne tatt litt lengre. Men greit, alle starter et sted.",
    "Den ruta er fin. Spesielt hvis du går baklengs i regnvær.",
    "Akkurat passe. Hvis du legger til en uke i kano.",
  ],
  cabinSelect: [
    "Den hytta sov jeg utenfor en gang. Mer luft.",
    "Bra valg. Husk å mate ovnen, ikke deg selv.",
    "Ulvene gjør opp bål utenfor for å holde meg unna.",
    "Senger er for pyser. Men greit, du tar den.",
    "Jeg tar bare med kniv. Du kan ta resten.",
    "Hytta er bra. Utedoen er bedre, mer utsikt.",
  ],
  searchEmpty: [
    "Ingen treff. Lars Monsen fant det allerede i 1992.",
    "Tomt her. Kompasset peker mot Canada.",
    "Søkte og søkte. Selv jeg gir opp av og til. Nesten.",
    "Null treff. Prøv et villere ord.",
  ],
  filterEmpty: [
    "Filtrene dine er strengere enn fjellvettreglene mine.",
    "Du har siktet vekk alle turene. Imponerende presisjon.",
    "Tomt. Som spiskammeret mitt etter en uke i Canada.",
  ],
  homeWisdom: [
    "Det er bare å begynne å gå. Det er det som er trikset.",
    "Ut på tur, aldri sur. Værmeldinga er en venn, ikke en sjef.",
    "Naturen er den beste læreren. Den gir aldri opp på deg.",
    "Uten mat og drikke duger bare jeg. Du, du må pakke.",
    "Eventyrlysta stiger med antall kilometer. Bare prøv.",
    "Det finnes ikke utfordringer, bare pyser. Er du pyse?",
    "Fjellvettreglene? Stiloppgave fra første klasse. Likevel: les dem.",
  ],
  packingIntro: [
    "Lars tar bare med kniv. Du får pakke litt mer.",
    "Pakk lett. Tunge sekker er for folk som ikke spiser hermetikk hel.",
    "Husk: bringebær er bare blåbær i forhold til jordbær. Det er pakkefilosofi.",
    "Fem meter tau, en kniv og en skog. Resten er bonus.",
  ],
  timelineEmpty: [
    "Legg til to hytter, så regner Lars ut etappene. Tre er bedre. Sju er optimalt.",
    "Tom tidslinje er fin. Men en tur trenger minst to punkter, ellers er det bare en piknik.",
    "Du må ha noe å gå mellom. Ellers er det bare ståing.",
  ],
  noParticipants: [
    "Ingen deltakere enda. Selv jeg drar med hundene mine.",
    "Tomt. Send lenka. Det er flere måter å overtale folk på, men dette er det lovligste.",
    "Ingen vil bli med? Da går du alene. Det er der man finner seg selv.",
  ],
  expenses: [
    "Kostnadssplitt kommer. Enklere enn å regne sjøl rundt bålet.",
    "Snart kan du dele utgiftene. Inntil da: betal for de andre. Sånn skaper man god energi.",
    "Splittfunksjon på vei. Husk: bamsemoms er den eneste avgifta jeg betaler.",
  ],
  discoverHero: [
    "Pan kartet, så finner Lars turene i området.",
    "Velg et område. Jeg pleier å bare gå, men greit.",
    "Zoom inn. Jeg ser allerede hyttene.",
    "Kart i hånda, kompass i hodet. Sånn finner vi turen.",
  ],
  loading: [
    "Henter data. Lars løper allerede.",
    "Beregner. Jeg hadde vært framme nå.",
    "Lars Monsen tar bare med kniv...",
    "Henter værvarsel. Jeg har det verken for varmt eller for kaldt.",
  ],
};

export function randomQuip(category: QuipCategory, seed?: number): string {
  const list = QUIPS[category];
  if (typeof seed === "number") {
    return list[Math.abs(seed) % list.length];
  }
  return list[Math.floor(Math.random() * list.length)];
}

export function pickQuips(category: QuipCategory, count: number): string[] {
  const list = QUIPS[category].slice();
  const out: string[] = [];
  for (let i = 0; i < count && list.length > 0; i++) {
    const idx = Math.floor(Math.random() * list.length);
    out.push(list.splice(idx, 1)[0]);
  }
  return out;
}

export function allQuips(category: QuipCategory): string[] {
  return QUIPS[category].slice();
}
