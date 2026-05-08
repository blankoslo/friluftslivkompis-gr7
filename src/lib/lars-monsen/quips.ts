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
  | "loading"
  | "weatherDanger"
  | "weatherSun"
  | "weatherCold"
  | "cabinFull"
  | "cabinFree"
  | "cabinUnknown"
  | "packingHeavy"
  | "packingLight"
  | "weightSkewed"
  | "weightBalanced"
  | "mealPlanReady"
  | "mealPlanEmpty"
  | "shoppingDone"
  | "inviteAccept"
  | "inviteDecline"
  | "inviteMaybe"
  | "tripCreated"
  | "tripDeleted"
  | "errorGeneric"
  | "errorNetwork"
  | "success"
  | "dayOpen"
  | "routeLong"
  | "routeShort"
  | "routeSteep"
  | "aiThinking"
  | "reminderAdded"
  | "reminderDue"
  | "expenseAdded"
  | "tabSwitch"
  | "panelHeader"
  | "logTitle"
  | "newTripIntro"
  | "inviteHero"
  | "inviteShare"
  | "etaShare"
  | "logEmpty"
  | "listSaved"
  | "listShare"
  | "weatherOutOfHorizon";

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
    "Sjarmerende liten skogstur. Ta med pølse, det blir koselig.",
    "Den ruta lukter ferskenhud. Tøff opp, kompis.",
    "Greit valg. Jeg tok denne i lunsjpausen i fjor.",
    "Hvis du sliter her, ikke ring. Jeg er i Yukon.",
    "Skikkelig fin. Jeg pleier å ta den med bind for øynene.",
  ],
  cabinSelect: [
    "Den hytta sov jeg utenfor en gang. Mer luft.",
    "Bra valg. Husk å mate ovnen, ikke deg selv.",
    "Ulvene gjør opp bål utenfor for å holde meg unna.",
    "Senger er for pyser. Men greit, du tar den.",
    "Jeg tar bare med kniv. Du kan ta resten.",
    "Hytta er bra. Utedoen er bedre, mer utsikt.",
    "Den hytta har tak. Jeg klarer meg uten, men greit for deg.",
    "Pent. Sov tungt, jeg holder vakt.",
    "Hytte med peis? Da kan du jo grilte tærne.",
    "Den der bygde jeg. Med én hånd. Mens jeg fisket.",
    "Trygg hytte. Bjørnen banker på først.",
    "Ovn, seng, og fire vegger? Luksusliv.",
  ],
  searchEmpty: [
    "Ingen treff. Lars Monsen fant det allerede i 1992.",
    "Tomt her. Kompasset peker mot Canada.",
    "Søkte og søkte. Selv jeg gir opp av og til. Nesten.",
    "Null treff. Prøv et villere ord.",
    "Tomt. Som ryggsekken min når jeg er ferdig.",
    "Ingen turer matcher. Du er for kresen, gutt.",
    "Søkemotoren ga opp. Jeg gjør det aldri.",
    "Null funn. Prøv 'villmark', det funker alltid.",
  ],
  filterEmpty: [
    "Filtrene dine er strengere enn fjellvettreglene mine.",
    "Du har siktet vekk alle turene. Imponerende presisjon.",
    "Tomt. Som spiskammeret mitt etter en uke i Canada.",
    "Filtre på filtre. Slipp opp litt, kompis.",
    "Du har filtrert vekk halve Norge. Imponerende.",
  ],
  homeWisdom: [
    "Det er bare å begynne å gå. Det er det som er trikset.",
    "Ut på tur, aldri sur. Værmeldinga er en venn, ikke en sjef.",
    "Naturen er den beste læreren. Den gir aldri opp på deg.",
    "Uten mat og drikke duger bare jeg. Du, du må pakke.",
    "Eventyrlysta stiger med antall kilometer. Bare prøv.",
    "Det finnes ikke utfordringer, bare pyser. Er du pyse?",
    "Fjellvettreglene? Stiloppgave fra første klasse. Likevel: les dem.",
    "Den korteste veien til lykke er en sti.",
    "Stillhet er ikke fravær av lyd. Det er lyden av fjell.",
    "Jeg fant meg selv i en myr i Finnmark. Anbefales.",
    "Surt vær finnes ikke. Bare feil klær og feil holdning.",
  ],
  packingIntro: [
    "Lars tar bare med kniv. Du får pakke litt mer.",
    "Pakk lett. Tunge sekker er for folk som ikke spiser hermetikk hel.",
    "Husk: bringebær er bare blåbær i forhold til jordbær. Det er pakkefilosofi.",
    "Fem meter tau, en kniv og en skog. Resten er bonus.",
    "Pakkelista er lengre enn ruta. Spar litt for kompisen.",
    "Glem ikke ulltrøye. Bomull dreper, sier de.",
    "Pakk for det verste, håp på det beste. Kos deg uansett.",
  ],
  timelineEmpty: [
    "Legg til to hytter, så regner Lars ut etappene. Tre er bedre. Sju er optimalt.",
    "Tom tidslinje er fin. Men en tur trenger minst to punkter, ellers er det bare en piknik.",
    "Du må ha noe å gå mellom. Ellers er det bare ståing.",
    "Ingen etapper enda. Selv jeg trenger mer enn én hytte for å gå tur.",
    "Tom liste. Plukk hytter, så lager Lars ruta.",
  ],
  noParticipants: [
    "Ingen deltakere enda. Selv jeg drar med hundene mine.",
    "Tomt. Send lenka. Det er flere måter å overtale folk på, men dette er det lovligste.",
    "Ingen vil bli med? Da går du alene. Det er der man finner seg selv.",
    "Null deltakere. Jeg pleier å gå med ulver, men de svarer ikke på SMS.",
    "Send invitasjonen, gutt. Folk venter ikke i evighet.",
  ],
  expenses: [
    "Kostnadssplitt kommer. Enklere enn å regne sjøl rundt bålet.",
    "Snart kan du dele utgiftene. Inntil da: betal for de andre. Sånn skaper man god energi.",
    "Splittfunksjon på vei. Husk: bamsemoms er den eneste avgifta jeg betaler.",
    "Pengediskusjon i fjellet? Hold munn og gå.",
    "Splittes likt. Hvis ikke, gå hver for seg.",
  ],
  discoverHero: [
    "Pan kartet, så finner Lars turene i området.",
    "Velg et område. Jeg pleier å bare gå, men greit.",
    "Zoom inn. Jeg ser allerede hyttene.",
    "Kart i hånda, kompass i hodet. Sånn finner vi turen.",
    "Kart er fint. Men ekte nordmenn følger lukta av bål.",
    "Tegnet et kart en gang. Det ble Norge.",
  ],
  loading: [
    "Henter data. Lars løper allerede.",
    "Beregner. Jeg hadde vært framme nå.",
    "Lars Monsen tar bare med kniv...",
    "Henter værvarsel. Jeg har det verken for varmt eller for kaldt.",
    "Vent litt. Jeg fanger ei ørret i mens.",
    "Kompasset spinner. Snart klart.",
    "Tråklar serveren. Den er treigere enn jeg.",
  ],
  weatherDanger: [
    "Storm? Det heter friskt vær der jeg kommer fra.",
    "Tordenvær. Bli i hytta, ikke vær helt.",
    "Det blåser hardt. Bind ned alt løst, særlig kompisen.",
    "Vinden er din venn. Hvis du går med den.",
    "Regnet kommer sidelengs. Det betyr at det går fort.",
  ],
  weatherSun: [
    "Sol og blå himmel. Mistenkelig. Pakk regnjakka.",
    "Strålende dag. Drikk vann, ikke bare luft.",
    "Solbrent panne er en del av dressen.",
    "Fint vær er bare lurevær. Vær på vakt.",
  ],
  weatherCold: [
    "Minus tjue er ikke kaldt. Det er friskt.",
    "Frost? Da blir myra bærbar.",
    "Kald luft renser hodet. Pust dypt.",
    "Ulltrøye, kompis. Bomull er for sofa.",
  ],
  weatherOutOfHorizon: [
    "For langt fram. Yr ser ni dager, jeg ser sesongen.",
    "Prognosen er ikke født enda. Pakk for normalt norsk vær.",
    "Vær så langt fram er gjetning. Stol heller på månedssnittet.",
    "Lars planlegger ikke vær. Lars kler seg etter måneden.",
    "Yr rekker ikke så langt. Jeg gjør det. Pakk ulltrøye uansett.",
  ],
  cabinFull: [
    "Hytta er full. Slå opp lavvo, det er gratis utsikt.",
    "Fullbooka. Sov ute, det er tøffere uansett.",
    "Booket bort. Jeg sover under stjerner uansett.",
    "Stengt? Bra. En ekte tur tar deg utenfor murene.",
  ],
  cabinFree: [
    "Plass til alle. Husk å sope golvet før du går.",
    "Ledig. Lars hadde tatt midtersenga, men du gjør som du vil.",
    "Åpen og klar. Tenn ovnen, ikke koka over.",
    "Fritt vilt. Sov godt, du har fortjent det.",
  ],
  cabinUnknown: [
    "Ukjent status. Ring, eller gå og banke på.",
    "Ingen vet. Pakk lavvo som plan B.",
    "Ledighet uklar. Spør hytteboka når du kommer fram.",
  ],
  packingHeavy: [
    "Sekken er for tung. Du er ikke esel.",
    "Reduser. Halvparten kan bli igjen, garantert.",
    "Du pakker som om du flytter. Det er en helgetur.",
    "Vekt på rygg = mindre glede. Trim lista.",
  ],
  packingLight: [
    "Lett pakka. Det blir en god tur.",
    "Dette holder. Resten finner du i naturen.",
    "Bra jobba. Sekken takker.",
  ],
  weightSkewed: [
    "Skjev fordeling. Spred godene, ellers blir det knurring i flokken.",
    "Noen bærer mer enn andre. Det er sånn man mister venner.",
    "Fordel jevnt. Ryggraden er ikke en konkurranse.",
    "Skjevt lastet. Den med mest klager først.",
  ],
  weightBalanced: [
    "Jevnt fordelt. Sånn skal det gjøres.",
    "Balansert flokk. Ingen klager før dag tre.",
    "Pent jobba. Alle bærer sitt.",
  ],
  mealPlanReady: [
    "Matplanen er klar. Stek skikkelig på bål, ikke i mikro.",
    "Mat planlagt. Husk: salt, smør og brennevin er ikke krydder, det er kjernen.",
    "Klart. Bak brød over bål, det imponerer flokken.",
    "Matplan landet. Spis godt, gå langt.",
  ],
  mealPlanEmpty: [
    "Ingen matplan. Sulten er den beste kokken, men greit å ha plan.",
    "Tomt. Lag en plan, ellers ender det med kjeks.",
    "Mat? Ja takk. Trykk knappen, så ordner Lars det.",
  ],
  shoppingDone: [
    "Handla? Bra. Nå er det bare å gå.",
    "Kvittert ut. Sekken nærmer seg pakkeklar.",
    "Ferdig handla. Husk å bytte bort to ting.",
  ],
  inviteAccept: [
    "Bra valg. Velkommen i flokken.",
    "Da er du med. Ikke bli sur når regnet kommer.",
    "Ja-svar. Spis frokost før du møter opp.",
    "Du sa ja. Lars hadde sagt ja først, men greit.",
  ],
  inviteDecline: [
    "Nei? Ditt tap. Vi har det fint uten deg.",
    "Sa nei. Pyse.",
    "Nei takk? Da går vi videre. Skuldrene ned.",
    "Du står over. Sofaen savner deg.",
  ],
  inviteMaybe: [
    "Vet ikke ennå? Bestem deg. Fjellet venter ikke.",
    "Kanskje, kanskje ikke. Værmeldinga endrer ikke seg om du vakler.",
    "Tenker fortsatt. Ta en kald dusj og bestem deg.",
  ],
  tripCreated: [
    "Tur opprettet. Nå er det bare å pakke og gå.",
    "Klar. Inviter flokken før de finner seg noe annet å gjøre.",
    "Tur i boks. Send lenka, gutt.",
    "Fint. Plan i hånda, skog i sikte.",
  ],
  tripDeleted: [
    "Tur slettet. Sofaen kalla på deg.",
    "Borte. Det skjer. Lag en ny.",
  ],
  errorGeneric: [
    "Noe knakk. Skjer i fjellet også. Prøv igjen.",
    "Krøll på lina. Pust, prøv på nytt.",
    "Feil. Selv jeg roter av og til.",
    "Surr i sekken. En ny prøvelse er bare en ny mulighet.",
  ],
  errorNetwork: [
    "Nettet sviktet. Bra at vi har papir også.",
    "Ingen dekning. Jeg vandret 87 dager uten. Du klarer 30 sekunder.",
    "Tilkobling falt. Hold pusten, prøv igjen.",
  ],
  success: [
    "Sånn ja. Nå går det fremover.",
    "Bra jobba. Lars nikker.",
    "Ferdig. Neste post.",
    "Pent. Det der blir bra.",
  ],
  dayOpen: [
    "Dag åpnet. Pakk for akkurat denne, ikke hele uka.",
    "Dagsplan klar. Spis frokost, gå tur, sov.",
    "Da er dagen din. Ikke kast bort lyset.",
  ],
  routeLong: [
    "Lang etappe. Bra. Beina trenger mer enn 3 km.",
    "Det blir noen kilometer. Ta mat, ta tid.",
    "Skikkelig dag. Sov godt før, sov dypere etter.",
  ],
  routeShort: [
    "Kort etappe? Ta en runde til.",
    "Det der er en spasertur. Legg til en topp.",
    "Lite bevegelse i dag. Spar et knekkebrød.",
  ],
  routeSteep: [
    "Bratt? Bra. Lårene takker senere.",
    "Mye stigning. Pust med magen.",
    "Opp og ned. Fjellet er ikke flat-track.",
  ],
  aiThinking: [
    "Tenker. Selv jeg må puste mellom kilometra.",
    "Beregner ruta. Et øyeblikk.",
    "AI-en jobber. Lars hadde brukt et kart, men greit.",
    "Et øyeblikk. Sjekker hvert tre på fjellet.",
  ],
  reminderAdded: [
    "Påminnelse satt. Du glemmer ikke nå.",
    "Ført opp. Lars glemmer aldri, men du kan trenge en lapp.",
    "Klart. Da husker vi det.",
  ],
  reminderDue: [
    "Tida er inne. Hopp i det.",
    "Påminnelsen ringer. Ikke utsett det.",
    "Klokka tikker. Gjør det nå.",
  ],
  expenseAdded: [
    "Utgift bokført. Splittes når flokken er klar.",
    "Kvittering inn. Ingen får snike seg unna.",
    "Notert. Lars betaler aldri, men noen må jo.",
  ],
  tabSwitch: [
    "Bra. Følg med på alt, ikke bare én ting.",
    "Skiftet. Helhet er kongen.",
  ],
  panelHeader: [
    "Følg med. Lars passer på deg.",
    "Her er sannheten. Ingen pynt.",
    "Det viktige står her. Ikke skum forbi.",
  ],
  logTitle: [
    "Turlogg. Bevis at sofaen ikke vant.",
    "Her er bragdene. Selv de små.",
    "Logg. Det er forskjellen på fortid og fjas.",
  ],
  newTripIntro: [
    "Ny tur? Bra. Begynn med et navn, resten ordner seg.",
    "Bygg den fra grunnen. Ikke vær redd for store mål.",
    "Tom side, åpen vei. Sånn liker vi det.",
  ],
  inviteHero: [
    "Du er invitert. Si ja, ellers ringer Lars.",
    "Bli med eller bli hjemme. Sofaen er feig.",
    "Velkommen. Pakk lett, smil tungt.",
  ],
  inviteShare: [
    "Send videre til en venn. Flere bein, mindre frykt.",
    "Del lenka. Sofagriser kan også reddes.",
    "Spre invitasjonen. Vidda har plass til flere.",
    "Send til en kompis. Bjørnene foretrekker grupper.",
    "Del den. Ingen fortjener å gå glipp av dette.",
  ],
  etaShare: [
    "Send lenka til kontakten. Sofaen sover ikke uroligere enn nødvendig.",
    "Smart. Noen hjemme bør vite når kaffen skal stå klar.",
    "Lenke sendt. Sjekk inn når du er trygt under tak.",
    "Fin øvelse. Selv jeg ringer mor før Yukon-tur.",
    "Klokka er satt. Kommer du sent, får kontakten beskjed.",
    "Bra valgt. Solotur uten plan er bare fjas i bushen.",
    "Ferdig. Send et bilde av utsikten når du er fremme.",
    "Bra. En forsinkelse uten varsling er bare drama.",
  ],
  logEmpty: [
    "Ingen turer planlagt. Sofaen vant runden, men kampen er ikke over.",
    "Tom logg. Lufta er fri og ventetiden kort.",
    "Ingen turer ennå. Pakk sekken, ikke unnskyldningene.",
    "Helt blankt. Da er det bare å booke første hytta.",
    "Tom kalender. Bjørnene venter ikke evig.",
  ],
  listSaved: [
    "Lagret. Ikke la den ligge i støv.",
    "Den er på lista. Sofaen rister allerede.",
    "Den blir med videre. Bra valg.",
  ],
  listShare: [
    "Send lista videre. Flere bein, mindre frykt.",
    "Del den. Ingen liste blir bedre av å ligge i lomma.",
    "Spre ordet. Naturen tåler litt sosialt press.",
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
