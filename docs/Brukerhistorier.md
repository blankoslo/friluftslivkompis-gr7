**FRILUFTSKOMPIS**

Brukerhistorier

Hackathon 2026

# Brukerhistorier

Brukerhistoriene er organisert etter brukerreisens seks faser. Hver
historie har akseptansekriterier i Gitt/Når/Så-format og en prioritet:
Høy, Medium eller Lav.

Brukerroller som brukes:

-   Turplanlegger: personen som starter en tur og tar hovedansvaret for
    planleggingen.

-   Turdeltaker: en person som er invitert til en tur, men ikke
    nødvendigvis initiativtaker.

-   Soloturer: en person som planlegger og går alene.

-   Gruppeleder: den i gruppen som koordinerer logistikk, pakkeliste og
    kostnader.

-   Administrator: systemrolle for oppsett, datatilgang og
    konfigurasjon.

## Discover

> **D1.** Som en **turplanlegger**, ønsker jeg **å kunne søke på område,
> hyttenavn eller fjelltopp**, slik at **jeg raskt finner relevante
> turalternativer uten å måtte lete på tvers av flere tjenester.
> \[Høy\]**

-   Gitt at brukeren skriver minst tre tegn i søkefeltet, når resultater
    > lastes, så vises forslag med autofullfør innen 300 ms.

-   Gitt at brukeren søker på «Jotunheimen», når resultatlisten vises,
    > så inneholder den både områder, hytter og fjelltopper.

-   Gitt at brukeren velger et søkeresultat, når kartet oppdateres, så
    > sentreres det på valgt lokasjon med relevante kartlag synlige.

> **D2.** Som en **turplanlegger**, ønsker jeg **å se et topografisk
> norgeskart med DNT-hytter som kartlag**, slik at **jeg får oversikt
> over hyttenettet i området jeg vurderer. \[Høy\]**

-   Gitt at kartet er lastet, når brukeren zoomer til et fjellområde, så
    > vises DNT-hytter med distinkt ikon.

-   Gitt at brukeren klikker på en hyttemarkør, når detaljpanelet åpnes,
    > så vises navn, type, kapasitet og eventuell tilgjengelighet.

> **D2b.** Som en **turplanlegger**, ønsker jeg **å se kommersielle
> hytter fra iNatur og AirBnB som eget kartlag ved siden av
> DNT-hytter**, slik at **jeg ser hele overnattingsbildet, ikke bare
> DNT-nettverket. \[Medium\]**

-   Gitt at kartet viser DNT-hytter, når brukeren aktiverer
    > «kommersielle hytter»-laget, så vises også hytter fra iNatur og
    > AirBnB med et annet ikon.

-   Gitt at både DNT og kommersielle hytter vises, når brukeren
    > filtrerer på «kun DNT», så skjules kommersielle hytter fra kartet.

> **D3.** Som en **turplanlegger**, ønsker jeg **å få turforslag basert
> på område, varighet, nivå og antall personer via en wizard**, slik at
> **jeg slipper å lete manuelt og får skreddersydde forslag. \[Høy\]**

-   Gitt at brukeren har fylt ut wizard-stegene, når forslag genereres,
    > så vises minst to turforslag med estimert varighet, høydemeter og
    > vanskelighetsgrad.

-   Gitt at forslagene vises, når brukeren velger ett, så populeres
    > turdetaljer med hytter, rute og værprognose.

-   Gitt at ingen forslag matcher kriteriene, når søket fullføres, så
    > vises en forklaring på hvorfor og forslag til å justere filtrene.

> **D4.** Som en **turplanlegger**, ønsker jeg **å kunne velge mellom
> klassiske hytteruter som forhåndsdefinerte forslag**, slik at **jeg
> raskt kan komme i gang med kjente ruter som Jotunheim-runden eller
> Rondane-kryssing. \[Medium\]**

-   Gitt at brukeren velger «Klassiske ruter», når listen vises, så
    > inneholder den minst fem kjente norske hytteruter med beskrivelse.

-   Gitt at brukeren velger en klassisk rute, når ruten lastes, så vises
    > alle etapper med hytter, avstander og høydeprofil på kartet.

> **D5.** Som en **soloturer**, ønsker jeg **å få forslag til dagsturer
> i nærheten basert på posisjon og vær**, slik at **jeg kan gå fra lyst
> til plan på noen få minutter. \[Medium\]**

-   Gitt at brukeren deler posisjon og det er godt vær, når
    > forslagssiden åpnes, så vises minst tre dagsturer innen 1 times
    > kjøring.

-   Gitt at et forslag velges, når turdetaljene vises, så inkluderes
    > parkering, GPX-fil, estimert tid og enkel pakkeliste.

> **D6.** Som en **turplanlegger**, ønsker jeg **å filtrere turer etter
> kategori som dagtur, helgetur, familievennlig, ski eller paddling**,
> slik at **jeg raskt smalner inn utvalget til det som passer vår gruppe
> og sesong. \[Medium\]**

-   Gitt at brukeren åpner filterpanelet, når en kategori velges, så
    > oppdateres kart og resultatliste til kun å vise turer i valgt
    > kategori.

-   Gitt at brukeren kombinerer flere filtre (f.eks. «familievennlig» +
    > «helgetur»), når resultatene vises, så matcher alle treff begge
    > kriteriene.

-   Gitt at et filter gir null resultater, når den tomme listen vises,
    > så foreslås det å fjerne det mest restriktive filteret.

> **D7.** Som en **turdeltaker**, ønsker jeg **å lagre turer i lister og
> se lister andre har delt**, slik at **jeg kan samle inspirasjon over
> tid og starte planlegging fra en lagret tur når det passer.
> \[Medium\]**

-   Gitt at brukeren ser på et turforslag, når hen trykker «Lagre», så
    > legges turen til i en valgfri liste (f.eks. «Sommerplaner»).

-   Gitt at en liste finnes, når brukeren trykker «Del», så genereres en
    > lenke som gir andre lesetilgang til listen.

-   Gitt at brukeren åpner en lagret tur, når hen trykker «Planlegg
    > denne», så opprettes en ny tur med rute og hytter forhåndsutfylt
    > fra det lagrede forslaget.

> **D8.** Som en **turplanlegger**, ønsker jeg **å få turforslag vektet
> mot egen turhistorikk og profilpreferanser**, slik at **forslagene
> treffer bedre enn generiske anbefalinger etter hvert som appen lærer
> hva jeg liker. \[Medium\]**

-   Gitt at brukeren har gjennomført minst tre turer, når forslagssiden
    > åpnes, så vektes forslagene mot nivå, geografi og turtype fra
    > historikken.

-   Gitt at brukeren har registrert preferanser i profilen (f.eks.
    > «foretrekker korte dager»), når turforslag genereres, så hensyntas
    > preferansene i rangeringen.

-   Gitt at brukeren ikke har turhistorikk ennå, når forslagssiden
    > åpnes, så faller anbefalingene tilbake til område, sesong,
    > gruppestørrelse og eksplisitte preferanser --- og det er tydelig
    > at forslagene blir mer presise med bruk.

-   Gitt at forslagene er personaliserte, når de vises, så er det synlig
    > at rangeringen er AI-basert og ikke en objektiv
    > kvalitetsvurdering.

> **D9.** Som en **turplanlegger**, ønsker jeg **å få alderstilpassede
> forslag når gruppen inkluderer barn**, slik at **familien får
> aktiviteter og ruter som passer yngste deltaker, uten at jeg må
> filtrere selv. \[Medium\]**

-   Gitt at en tur opprettes med deltakere under 12 år, når turforslag
    > genereres, så vises kun ruter og aktiviteter tilpasset yngste
    > deltakers alder.

-   Gitt at familien har barn i ulik alder, når forslagene vises, så
    > markeres hvilke aktiviteter som passer for hvilke aldersgrupper.

-   Gitt at en rute er merket som ikke barnevennlig, når den vises i
    > resultatlisten, så skjules den eller markeres med en tydelig
    > advarsel.

> **D10.** Som en **turplanlegger**, ønsker jeg **å opprette en
> ferieplan med flere dager og varierte aktiviteter som dagstur, padling
> og utflukter**, slik at **familien får en samlet tidslinje for hele
> ferien, ikke bare enkeltturer. \[Medium\]**

-   Gitt at brukeren oppretter en ferie over flere dager, når tidslinjen
    > vises, så kan hen legge til ulike aktivitetstyper per dag
    > (fjelltur, padling, fisking, hviledag).

-   Gitt at en aktivitet krever forhåndsbestilling (f.eks.
    > kajakkutleie), når den legges inn i planen, så vises en påminnelse
    > om å booke med lenke til leverandør.

-   Gitt at været er dårlig på en planlagt turdag, når varselet
    > oppdateres, så foreslås det å bytte til en innendørsaktivitet
    > eller flytte turen til en reservedag.

> **D11.** Som en **turplanlegger**, ønsker jeg **å se valgt rute tegnet
> på kartet med høydeprofil, avstand og estimert tid**, slik at **jeg
> kan vurdere ruten visuelt før jeg bestemmer meg, i stedet for å lese
> en tabell med tall. \[Høy\]**

-   Gitt at en rute er valgt, når kartet oppdateres, så tegnes ruten som
    > en synlig linje med fargekoding for vanskelighetsgrad per segment.

-   Gitt at ruten vises på kartet, når brukeren trykker på
    > høydeprofil-ikonet, så vises en graf med høyde over avstand, der
    > hytter og veipunkter er markert.

-   Gitt at ruten har flere etapper, når brukeren trykker på en etappe i
    > profilen, så zoomes kartet til den aktuelle etappen med avstand og
    > estimert tid.

## Decide

> **B1.** Som en **turplanlegger**, ønsker jeg **å se værvarsel for
> valgt lokasjon og valgt periode**, slik at **jeg kan ta en informert
> beslutning om når vi bør dra. \[Høy\]**

-   Gitt at en tur har valgt dato og sted, når værdata lastes, så vises
    > temperatur, nedbør, vind og værsymbol per dag for valgt periode.

-   Gitt at værvarselet strekker seg lenger enn 9 dager, når
    > langtidsvarselet vises, så markeres det med lavere pålitelighet.

-   Gitt at værdata ikke er tilgjengelig, når feilen oppstår, så vises
    > en tydelig melding i stedet for tomme felter.

> **B2.** Som en **turplanlegger**, ønsker jeg **å sjekke
> tilgjengelighet for enkelhytter på valgte datoer**, slik at **jeg vet
> om hytta er ledig før jeg går videre med planen. \[Høy\]**

-   Gitt at en hytte er valgt og datoer er satt, når tilgjengeligheten
    > sjekkes, så vises status: ledig, fullt eller ukjent.

-   Gitt at en hytte er fullbooket, når konflikten oppdages, så foreslås
    > alternative hytter eller datoer.

> **B2b.** Som en **turplanlegger**, ønsker jeg **å sjekke
> kjede-tilgjengelighet for alle hytter i en flerdagsrute samtidig**,
> slik at **jeg vet om hele turen lar seg gjennomføre før jeg inviterer
> folk. \[Høy\]**

-   Gitt at en flerdagsrute har flere hytter, når kjede-tilgjengelighet
    > sjekkes, så vises samlet status for hele ruten: alle ledige, eller
    > hvilke etapper som har konflikter.

-   Gitt at én eller flere hytter i kjeden er fulle, når konflikten
    > vises, så foreslås alternative hytter eller datoer som løser hele
    > kjeden.

> **B3.** Som en **turplanlegger**, ønsker jeg **å se ruteplanlegging
> mellom hytter med avstand, tid og høydemeter per etappe**, slik at
> **jeg kan vurdere om ruten er realistisk for gruppen vår. \[Høy\]**

-   Gitt at flere hytter er valgt i rekkefølge, når ruten beregnes, så
    > vises total distanse, høydemeter og estimert tid per etappe.

-   Gitt at en etappe har mer enn 1000 høydemeter, når ruten vises, så
    > markeres etappen som krevende.

-   Gitt at brukeren endrer rekkefølgen på hyttene, når ruten
    > oppdateres, så reflekteres endringen umiddelbart i kartet og
    > statistikken.

> **B4.** Som en **turplanlegger**, ønsker jeg **å se kjøretid og
> kollektivrute til turutgangspunktet**, slik at **jeg kan planlegge
> transporten som en del av turen. \[Medium\]**

-   Gitt at et startpunkt er valgt, når reiseruten beregnes, så vises
    > både kjøretid og kollektivalternativ med avgangstider.

-   Gitt at brukeren ikke har bil, når kollektivrute vises, så
    > inkluderes buss, tog og eventuelt båt fra Entur.

> **B5.** Som en **turplanlegger**, ønsker jeg **å få et kostnadsestimat
> per person og per dag**, slik at **gruppen vet omtrent hva turen vil
> koste før vi bestemmer oss. \[Lav\]**

-   Gitt at hytter og transport er valgt, når estimatet genereres, så
    > vises en oversikt med hyttekostnad, transport og mat per person.

-   Gitt at gruppen endrer antall dager, når estimatet oppdateres, så
    > reflekteres endringen automatisk.

> **B6.** Som en **turdeltaker**, ønsker jeg **å se dag-for-dag-visning
> for flerdagsturer**, slik at **jeg forstår hele turen som en sekvens
> av etapper, ikke som en uoversiktlig liste. \[Høy\]**

-   Gitt at en flerdagstur er opprettet, når tidslinjen vises, så har
    > hver dag egen etappe med hytte, distanse, vær og høydeprofil.

-   Gitt at været endrer seg for én dag, når tidslinjen oppdateres, så
    > markeres den aktuelle dagen med oppdatert vær.

> **B7.** Som en **turplanlegger**, ønsker jeg **å se snøforhold,
> skredvarsel og merking for ruter og områder**, slik at **jeg kan ta et
> informert valg om ruten er trygg nok for oss på det tidspunktet vi
> planlegger. \[Medium\]**

-   Gitt at en rute går gjennom snødekt terreng, når turdetaljene vises,
    > så hentes faregrad fra Varsom og vises per etappe.

-   Gitt at skredvarselet er på nivå 3 (betydelig) eller høyere, når
    > brukeren ser ruten, så vises en tydelig advarsel med anbefaling om
    > å velge alternativ rute, og lenke til Varsoms detaljerte
    > vurdering.

-   Gitt at sti-merking eller tilstand er kjent, når ruteinformasjonen
    > vises, så vises merking (T-, rød, blå, svart) og sesongstatus,
    > slik at brukeren kan vurdere om ruten krever spesialutstyr.

> **B8.** Som en **turplanlegger**, ønsker jeg **å få en AI-vurdering av
> om ruten er realistisk for gruppen vår**, slik at **vi unngår å velge
> en tur som er for ambisiøs for svakeste deltaker. \[Medium\]**

-   Gitt at rute og gruppesammensetning er kjent, når brukeren ber om
    > vurdering, så vises en oppsummering som tar hensyn til høydemeter,
    > distanse og deltakernes erfaring.

-   Gitt at AI vurderer ruten som krevende for gruppen, når vurderingen
    > vises, så foreslås konkrete justeringer (kortere etapper, lettere
    > alternativ rute).

-   Gitt at vurderingen er AI-generert, når den vises, så er det tydelig
    > markert at dette er et anslag, ikke en garanti.

> **B9.** Som en **turplanlegger**, ønsker jeg **å se sanntidsvær
> (NowCast) for et område i tillegg til prognosen**, slik at **jeg kan
> sjekke om forholdene akkurat nå stemmer med planen, spesielt på
> turdagen. \[Lav\]**

-   Gitt at brukeren er på tursiden på selve avreisedagen, når
    > NowCast-data hentes, så vises nåværende nedbør, temperatur og
    > vindforhold for turens startpunkt.

-   Gitt at NowCast viser avvik fra prognosen, når avviket er vesentlig,
    > så varsles brukeren med en endringsanbefaling.

> **B10.** Som en **turplanlegger**, ønsker jeg **å få et konkret
> omplanleggingsforslag fra appen når værvarselet endrer seg
> vesentlig**, slik at **jeg ser hva appen foreslår og hvilke
> konsekvenser det har, før jeg tar et valg. \[Høy\]**

-   Gitt at værvarselet for en planlagt turdag endrer seg til dårlig
    > vær, når endringen oppdages, så mottar turplanleggeren et varsel
    > med et konkret forslag: flytt dagsetappen, velg lavere alternativ
    > rute, eller bytt rekkefølge på etapper.

-   Gitt at et omplanleggingsforslag vises, når turplanleggeren ser det,
    > så vises konsekvensene for pakkeliste, hytte-tilgjengelighet og
    > estimert tid.

-   Gitt at gruppen har en flerdagstur, når været er dårlig på én dag
    > men bra på en annen, så foreslår appen å bytte dagenes innhold
    > fremfor å avlyse.

-   Gitt at omplanleggingsforslaget er AI-generert, når det vises, så er
    > det tydelig merket som et forslag, og værdataene forslaget bygger
    > på er synlige.

> **B10b.** Som en **turplanlegger**, ønsker jeg **å akseptere et
> omplanleggingsforslag og få tidslinjen, pakkelisten og deltakervarsler
> oppdatert automatisk**, slik at **gruppen går fra beslutning til
> oppdatert plan på ett trykk. \[Høy\]**

-   Gitt at turplanleggeren aksepterer forslaget, når endringen
    > bekreftes, så oppdateres tidslinjen og ruten automatisk.

-   Gitt at endringen påvirker pakkelisten, når tidslinjen oppdateres,
    > så oppdateres pakkelisten automatisk med bevarte brukerendringer
    > der de ikke konflikterer.

-   Gitt at endringen er bekreftet, når oppdateringen er fullført, så
    > varsles alle deltakere om hva som er endret.

> **B11.** Som en **turplanlegger**, ønsker jeg **å booke eller
> reservere direkte fra appen der API-tilgang finnes**, slik at **jeg
> gjennomfører reservasjonen uten å forlate appen. \[Medium\]**

-   Gitt at en hytte har direkte booking via API, når brukeren trykker
    > «Book», så gjennomføres reservasjonen uten å forlate appen.

-   Gitt at direkte booking feiler (API nede, timeout, avvisning), når
    > feilen oppstår, så vises en fallback-lenke til leverandørens
    > bookingside med turkontekst bevart.

> **B11b.** Som en **turplanlegger**, ønsker jeg **å bli sendt til
> leverandørens bookingside med dato og antall forhåndsutfylt når
> direkte booking ikke finnes**, slik at **jeg slipper å taste inn
> turinformasjonen på nytt hos leverandøren. \[Medium\]**

-   Gitt at direkte booking ikke er tilgjengelig, når brukeren trykker
    > «Book», så åpnes leverandørens bookingside med dato og antall
    > forhåndsutfylt der det er mulig.

-   Gitt at en aktivitet (f.eks. kajakkutleie) krever separat booking,
    > når den er lagt inn i planen, så vises en direkte lenke til
    > leverandør med relevant informasjon.

-   Gitt at brukeren sendes til en ekstern bookingside, når hen kommer
    > tilbake til appen, så er turkonteksten bevart og brukeren lander
    > på samme sted i planen.

> **B12.** Som en **turplanlegger**, ønsker jeg **å gå videre til kjøp
> av anbefalt kollektivreise fra turplanen**, slik at **jeg slipper å
> søke opp samme reise på nytt i Entur eller en annen app. \[Medium\]**

-   Gitt at B4 har vist en anbefalt kollektivrute, når brukeren trykker
    > «Kjøp billett», så åpnes Entur eller annen billett-app med rute,
    > dato og antall reisende forhåndsutfylt.

-   Gitt at kollektivruten har flere etapper (buss + tog), når
    > kjøpssiden åpnes, så inkluderes hele reisekjeden, ikke bare første
    > etappe.

-   Gitt at kjøpshandoff feiler eller forhåndsutfylling ikke støttes,
    > når brukeren trykker «Kjøp billett», så vises ruteinformasjonen på
    > skjermen slik at brukeren manuelt kan taste den inn i
    > billett-appen.

> **B13.** Som en **turplanlegger**, ønsker jeg **å få forslag til
> optimale datoer basert på værprognose og hytte-tilgjengelighet**, slik
> at **jeg slipper å manuelt kryssjekke vær og ledige hytter for å finne
> den beste helgen. \[Høy\]**

-   Gitt at brukeren har valgt område og hytter men ikke dato, når
    > datoforslag genereres, så rangeres de neste aktuelle helgene etter
    > kombinasjon av vær og tilgjengelighet.

-   Gitt at de tre beste helgene vises, når brukeren ser forslagene, så
    > vises værsammendrag og hyttestatus per forslag slik at hen kan
    > sammenligne.

-   Gitt at brukeren velger en anbefalt helg, når valget bekreftes, så
    > settes dato for turen og tilgjengelighet oppdateres automatisk.

-   Gitt at værdata og tilgjengelighetsdata peker i forskjellige
    > retninger, når forslagene vises, så er trade-offen synlig (f.eks.
    > «litt dårligere vær, men alle hytter ledige») slik at brukeren kan
    > ta et informert valg.

-   Gitt at dato-rangeringen er AI-basert, når forslagene vises, så er
    > det tydelig merket som anbefalinger med underliggende data synlig.

> **B14.** Som en **turplanlegger**, ønsker jeg **å få en AI-generert
> sammenligning av hytter i et område**, slik at **jeg forstår hva som
> skiller hyttene uten å måtte lese fem separate beskrivelser.
> \[Medium\]**

-   Gitt at brukeren har to eller flere hytter i samme område, når hen
    > åpner sammenligning, så vises en oppsummering med pris, kapasitet,
    > beliggenhet og hva som gjør hver hytte distinkt.

-   Gitt at sammenligningen vises, når brukeren ser den, så er
    > AI-generert tekst tydelig merket og basert på faktisk data fra
    > hyttekildene.

-   Gitt at én hytte passer gruppens behov best, når AI foreslår den, så
    > forklares begrunnelsen (f.eks. «nærmest forrige etappe, billigst,
    > ledig på valgt dato»).

-   Gitt at en hytte har mangelfulle data (mangler pris eller
    > kapasitet), når sammenligningen vises, så markeres manglende
    > felter tydelig i stedet for å utelate hytta.

## Gather

> **G1.** Som en **turplanlegger**, ønsker jeg **å opprette en tur og
> invitere deltakere via en delbar lenke**, slik at **folk kan se og
> akseptere turen uten å laste ned en app først. \[Høy\]**

-   Gitt at en tur er opprettet, når brukeren trykker «Inviter», så
    > genereres en unik URL som kan deles.

-   Gitt at en invitert person åpner lenken, når tursiden lastes, så
    > vises turdetaljer, kart, vær og deltakerliste uten innlogging.

-   Gitt at en deltaker aksepterer invitasjonen, når aksepten
    > registreres, så oppdateres deltakerlisten for alle.

> **G2.** Som en **turdeltaker**, ønsker jeg **å stemme på alternativer
> når gruppen ikke er enig om dato eller hytte**, slik at **vi lander en
> beslutning uten endeløs diskusjon i gruppechat. \[Medium\]**

-   Gitt at turplanleggeren har lagt inn to eller flere alternativer,
    > når avstemningen åpnes, så kan hver deltaker avgi sin stemme.

-   Gitt at alle har stemt, når resultatet vises, så fremheves vinneren
    > og turplanleggeren kan bekrefte valget.

> **G3.** Som en **turdeltaker**, ønsker jeg **å melde meg på deler av
> turen**, slik at **jeg kan bli med på de dagene som passer meg uten å
> blokkere resten av gruppen. \[Medium\]**

-   Gitt at en flerdagstur er opprettet, når deltakeren velger
    > deltidsdeltakelse, så kan hen velge hvilke dager hen er med.

-   Gitt at en deltaker kun er med tre av fem dager, når pakkelisten
    > genereres, så tilpasses den til deltakers faktiske dager.

> **G4.** Som en **turplanlegger**, ønsker jeg **å se hvem som har
> svart, hvem som venter og hvem som har avslått**, slik at **jeg vet
> hvor vi står uten å måtte sende purringer manuelt. \[Høy\]**

-   Gitt at invitasjoner er sendt, når statussiden åpnes, så vises hver
    > deltaker med status: akseptert, venter eller avslått.

-   Gitt at en deltaker ikke har svart innen 48 timer, når
    > påminnelsesfristen utløper, så kan turplanlegger sende en
    > påminnelse med ett trykk.

> **G5.** Som en **turdeltaker**, ønsker jeg **å ha en kommentartråd per
> tur der gruppen kan diskutere detaljer**, slik at **vi slipper å spre
> diskusjonen over SMS, Messenger og e-post. \[Medium\]**

-   Gitt at en tur er opprettet, når en deltaker legger igjen en
    > kommentar, så er den synlig for alle andre deltakere i sanntid.

-   Gitt at en kommentar nevner et valg (f.eks. dato eller hytte), når
    > turredigering skjer, så vises kommentaren som kontekst ved
    > endringen.

-   Gitt at en deltaker ikke har appen, når kommentartråden åpnes via
    > turlenken, så kan hen lese og svare uten innlogging.

> **G6.** Som en **turdeltaker**, ønsker jeg **å registrere preferanser
> og erfaringsnivå i en deltakerprofil**, slik at **turplanleggeren får
> bedre grunnlag for å velge passende rute og tempo. \[Medium\]**

-   Gitt at en deltaker åpner profilen sin, når hen velger erfaringsnivå
    > og preferanser, så lagres dette og gjenbrukes på tvers av turer.

-   Gitt at alle i gruppen har fylt ut profil, når turplanleggeren ser
    > gruppesammendrag, så vises svakeste og sterkeste nivå sammen med
    > preferanse-overlapp.

> **G7.** Som en **turplanlegger**, ønsker jeg **å få et AI-generert
> kompromissforslag når gruppen ikke blir enig**, slik at **vi løser opp
> fastlåste diskusjoner uten at noen må gi seg helt. \[Medium\]**

-   Gitt at en avstemning har stått uavgjort i mer enn 24 timer, når AI
    > analyserer alternativene, så foreslås et kompromiss som balanserer
    > flest deltakeres preferanser.

-   Gitt at kompromissforslaget vises, når gruppen ser det, så forklares
    > begrunnelsen og gruppen kan akseptere eller forkaste det.

-   Gitt at kompromisset er AI-generert, når det vises, så er det
    > tydelig merket som forslag og ikke som gruppas beslutning.

> **G8.** Som en **turdeltaker**, ønsker jeg **å få en alternativ rute
> og møtepunkt når jeg bare er med deler av en flerdagstur**, slik at
> **jeg vet nøyaktig hvor og når jeg møter gruppen og forlater den, uten
> at noen må planlegge det manuelt. \[Medium\]**

-   Gitt at en deltaker har meldt seg på dag 3--5 av en femdagers tur,
    > når appen beregner del-ruten, så vises et anbefalt møtepunkt med
    > transport dit og en tilpasset etappeplan.

-   Gitt at møtepunktet krever transport, når del-ruten vises, så
    > inkluderes kjøretid eller kollektivrute til møtepunktet.

-   Gitt at deltakeren forlater turen før resten av gruppen, når
    > avslutningspunktet beregnes, så vises nærmeste punkt med vei-
    > eller kollektivtilgang.

> **G9.** Som en **turplanlegger**, ønsker jeg **å kunne invitere noen
> til å «komme innom» på en spesifikk dag eller etappe midt i turen**,
> slik at **venner og familie kan slutte seg til oss underveis uten å
> forplikte seg til hele turen. \[Lav\]**

-   Gitt at en tur er pågående eller planlagt, når turplanleggeren
    > inviterer en person til en spesifikk dag, så får hen en lenke med
    > kun de relevante detaljene for den dagen.

-   Gitt at en ad-hoc-deltaker aksepterer, når hen legges til på den
    > aktuelle dagen, så oppdateres matplan og eventuell
    > utstyrsfordeling for den dagen.

> **G10.** Som en **turplanlegger**, ønsker jeg **å koordinere kjøring
> til startpunktet --- hvem kjører, hvem er passasjer og hvem må
> hentes**, slik at **alle vet hvordan de kommer seg til
> turutgangspunktet uten å koordinere det i gruppechat. \[Medium\]**

-   Gitt at turen har et definert startpunkt, når kjørekoordinering
    > åpnes, så kan deltakere markere seg som sjåfør (med antall
    > plasser) eller passasjer.

-   Gitt at sjåfører og passasjerer er registrert, når fordelingen
    > vises, så ser alle hvem de kjører med og eventuell hentadresse.

-   Gitt at en deltaker ikke har skyss, når ufordelte passasjerer
    > finnes, så varsles sjåfører med ledig plass.

-   Gitt at en sjåfør faller fra eller kapasitet endres, når endringen
    > registreres, så varsles berørte passasjerer og kjørefordelingen
    > oppdateres automatisk.

## Prepare

> **P1.** Som en **gruppeleder**, ønsker jeg **å få en AI-generert
> pakkeliste basert på vær, varighet og antall personer**, slik at **vi
> ikke glemmer viktige ting og slipper å bygge listen fra bunnen av.
> \[Høy\]**

-   Gitt at tur er opprettet med dato, sted og deltakere, når
    > pakkelisten genereres, så er den tilpasset forventet vær, varighet
    > og gruppestørrelse.

-   Gitt at brukeren fjerner eller legger til elementer, når listen
    > lagres, så beholdes brukerens tilpasninger.

-   Gitt at pakkelisten er AI-generert, når den vises, så er
    > AI-foreslåtte elementer visuelt skilt fra brukerens egne tillegg.

> **P1b.** Som en **gruppeleder**, ønsker jeg **å få pakkelisten
> automatisk oppdatert når vær, plan eller gruppesammensetning endrer
> seg**, slik at **listen holder seg relevant uten at jeg må oppdatere
> den manuelt. \[Medium\]**

-   Gitt at værvarselet endrer seg, når listen oppdateres, så legges
    > relevante endringer til (f.eks. regnplagg) med tydelig markering.

-   Gitt at turen omplanlegges via B10, når pakkelisten oppdateres
    > automatisk, så bevares manuelle brukerendringer der de ikke
    > konflikterer med den nye planen, og konflikter markeres tydelig.

-   Gitt at gruppen inkluderer barn, når pakkelisten genereres, så
    > inkluderes barnespesifikke elementer (ekstra varme lag, solkrem,
    > tilpasset matpakke) basert på barnas alder.

> **P2.** Som en **gruppeleder**, ønsker jeg **å fordele utstyr i
> gruppen med avkvittering**, slik at **vi vet hvem som tar med
> gassbrenner, telt og førstehjelp uten å koordinere det i chat.
> \[Høy\]**

-   Gitt at pakkelisten inneholder fellesutstyr, når fordelingen åpnes,
    > så kan gruppelederen tildele gjenstander til spesifikke deltakere.

-   Gitt at en gjenstand er tildelt, når deltakeren åpner sin
    > pakkeliste, så ser hen gjenstanden med en «kvitter ut»-knapp.

-   Gitt at alle har kvittert ut, når gruppelederen ser oversikten, så
    > vises en komplett status over hva som er pakket og hva som
    > mangler.

> **P3.** Som en **turdeltaker**, ønsker jeg **å se min personlige
> pakkeliste med både egne og tildelte ting**, slik at **jeg har én
> oversikt over alt jeg skal ha med meg. \[Medium\]**

-   Gitt at pakkeliste og fordeling er gjort, når deltakeren åpner sin
    > liste, så vises personlige ting og fellesansvar i én samlet
    > visning.

-   Gitt at det er en flerdagstur, når listen vises, så er mat og gass
    > beregnet for riktig antall dager.

> **P4.** Som en **turplanlegger**, ønsker jeg **å sette påminnelser X
> dager før avreise**, slik at **deltakerne får beskjed i tide om å
> pakke, kjøpe mat eller sjekke været. \[Lav\]**

-   Gitt at en påminnelse er satt, når datoen inntreffer, så mottar alle
    > deltakere et varsel.

-   Gitt at påminnelsen er om pakking, når varselet vises, så lenker det
    > direkte til deltakerens pakkeliste.

> **P5.** Som en **gruppeleder**, ønsker jeg **å få en AI-generert
> matplan per etappe med mengder tilpasset antall deltakere**, slik at
> **vi vet hva vi trenger av mat for hele turen uten å planlegge
> manuelt. \[Medium\]**

-   Gitt at antall dager, deltakere og måltider er satt, når matplanen
    > genereres, så vises forslag per etappe med mengder tilpasset
    > antall personer.

-   Gitt at en deltaker kun er med deler av turen, når matplanen
    > beregnes, så justeres mengdene per etappe etter faktisk antall
    > deltakere den dagen.

> **P5b.** Som en **gruppeleder**, ønsker jeg **å få en samlet
> handleliste fra matplanen med fordeling av handleansvar**, slik at
> **vi kjøper riktig mengde mat på forhånd og vet hvem som handler hva.
> \[Medium\]**

-   Gitt at matplanen er godkjent, når handlelisten genereres, så
    > summeres alle ingredienser på tvers av etapper i én kjøpeliste.

-   Gitt at handlelisten er klar, når gruppelederen fordeler ansvar, så
    > kan hver deltaker se hvilke varer de har ansvar for å kjøpe og
    > kvittere ut at det er handlet.

> **P6.** Som en **gruppeleder**, ønsker jeg **å se estimert bærevekt
> per person basert på pakkeliste, mat og fellesutstyr**, slik at **vi
> kan fordele rettferdig og unngå at noen får for tung sekk. \[Lav\]**

-   Gitt at pakkeliste og matplan er ferdig, når vektoversikten vises,
    > så ser hver deltaker sin estimerte totalvekt (personlig + tildelt
    > fellesutstyr + mat).

-   Gitt at én deltaker har vesentlig mer vekt enn andre, når ubalansen
    > oppdages, så foreslås en omfordeling.

> **P7.** Som en **gruppeleder**, ønsker jeg **å få en samlet
> forhåndskjøpsliste for forbruksvarer utover mat, som gass, batterier
> og førstehjelp**, slik at **vi handler alt vi trenger på én gang i
> stedet for å oppdage at noe mangler på turdagen. \[Lav\]**

-   Gitt at pakkeliste og matplan er ferdig, når forhåndskjøpslisten
    > genereres, så samles alle varer som må kjøpes inn (gass beregnet
    > per dag, batterier, solkrem, etc.) i én liste.

-   Gitt at gassmengde avhenger av antall dager og personer, når
    > beregningen vises, så angis anbefalt mengde i gram eller antall
    > bokser.

-   Gitt at listen er klar, når gruppelederen fordeler ansvar, så kan
    > hver deltaker kvittere ut hva de har kjøpt.

## Go

> **T1.** Som en **turdeltaker**, ønsker jeg **å ha tilgang til
> offline-kart og ruteinformasjon for mine etapper**, slik at **jeg kan
> navigere trygt selv uten mobildekning. \[Høy\]**

-   Gitt at turen er lastet ned for offline bruk, når enheten mister
    > nettilgang, så er kart, rute og hytteinformasjon fortsatt
    > tilgjengelig.

-   Gitt at brukeren er på en etappe, når GPS-posisjon oppdateres, så
    > vises posisjon på det nedlastede kartet.

> **T2.** Som en **turdeltaker**, ønsker jeg **å se
> parkeringsinformasjon og koordinater for turutgangspunktet**, slik at
> **jeg finner startpunktet uten å måtte google det separat.
> \[Medium\]**

-   Gitt at en tur har et definert startpunkt, når turdetaljene vises,
    > så inkluderes parkeringsplass med koordinater og eventuell avgift.

-   Gitt at brukeren trykker på parkeringskoordinatene, når
    > navigasjonsappen åpnes, så settes destinasjonen automatisk.

> **T3.** Som en **gruppeleder**, ønsker jeg **å dele posisjon med
> gruppen under turen**, slik at **vi vet hvor alle er hvis vi sprer oss
> eller går i ulikt tempo. \[Lav\]**

-   Gitt at delt lokasjon er aktivert (opt-in), når gruppemedlemmene har
    > appen åpen, så vises alles posisjon på kartet.

-   Gitt at en deltaker deaktiverer deling, når innstillingen endres, så
    > fjernes posisjonen fra gruppekartet umiddelbart.

> **T4.** Som en **turdeltaker**, ønsker jeg **å sjekke inn ved ankomst
> til en hytte**, slik at **gruppen og systemet vet at jeg har kommet
> trygt frem. \[Lav\]**

-   Gitt at deltakeren er i nærheten av en hytte på ruten, når hen
    > trykker «Sjekk inn», så registreres ankomsten og gruppen varsles.

-   Gitt at alle i gruppen har sjekket inn, når siste person registrerer
    > seg, så oppdateres etappestatusen til «fullført».

> **T5.** Som en **soloturer**, ønsker jeg **å eksportere GPX-ruten til
> klokke eller annen GPS-enhet**, slik at **jeg kan navigere via klokka
> uten å ha telefonen fremme hele tiden. \[Medium\]**

-   Gitt at en tur har en definert rute, når brukeren trykker «Eksporter
    > GPX», så genereres en standard GPX-fil klar for nedlasting.

-   Gitt at brukeren har en tilkoblet Garmin eller lignende, når
    > GPX-filen overføres, så vises ruten på klokka med waypoints for
    > hytter og viktige punkt.

> **T6.** Som en **turplanlegger**, ønsker jeg **å ha nødkontakter og
> nødtelefonnumre tilgjengelig offline**, slik at **vi vet hvem vi skal
> ringe og hvor vi skal henvende oss hvis noe skjer. \[Høy\]**

-   Gitt at en tur er lastet ned for offline bruk, når brukeren åpner
    > nødinfo, så vises redningstelefon (113), nærmeste legevakt og
    > nærmeste bemannede hytte --- også uten nettilgang.

-   Gitt at turplanleggeren har lagt inn nødkontakter for gruppen, når
    > en deltaker åpner nødinfo, så vises kontaktinformasjonen offline
    > og kan ringes direkte når enheten har dekning.

> **T7.** Som en **soloturer**, ønsker jeg **å dele estimert
> hjemkomsttid med en kontaktperson**, slik at **noen hjemme vet når de
> kan forvente meg tilbake, og kan reagere om det tar for lang tid.
> \[Lav\]**

-   Gitt at turen har en beregnet varighet, når brukeren aktiverer
    > ETA-deling, så sendes en melding til valgt kontaktperson med
    > forventet hjemkomst.

-   Gitt at brukeren er vesentlig forsinket i forhold til ETA, når
    > forsinkelsen passerer en terskel, så mottar kontaktpersonen et
    > oppdatert varsel.

> **T8.** Som en **turdeltaker**, ønsker jeg **å følge ruten i sanntid
> med kompass og retningsanvisning til neste waypoint**, slik at **jeg
> kan navigere trygt uten å måtte bruke en egen kartapp ved siden av.
> \[Høy\]**

-   Gitt at en etappe er startet, når GPS-posisjon oppdateres, så vises
    > en retningspil mot neste waypoint og estimert distanse og tid
    > igjen på etappen.

-   Gitt at brukeren åpner navigasjonsvisningen, når kompasset vises, så
    > peker det mot neste hytte eller veipunkt på ruten.

-   Gitt at brukeren avviker vesentlig fra ruten, når avviket oppdages,
    > så vises et varsel med forslag om å komme tilbake på ruten.

-   Gitt at enheten er offline, når navigasjonen brukes, så fungerer
    > kompass og rute-follow basert på nedlastede data og GPS.

## Return

> **R1.** Som en **gruppeleder**, ønsker jeg **å registrere utgifter
> underveis og få en rettferdig splitt-beregning**, slik at **vi gjør
> opp økonomien uten regneark. \[Medium\]**

-   Gitt at utgifter er registrert, når splitten beregnes, så minimeres
    > antall transaksjoner og hver person ser hva de skylder eller har
    > til gode.

-   Gitt at en deltaker bare var med deler av turen, når splitten
    > beregnes, så fordeles kun kostnadene for de dagene deltakeren
    > faktisk var med.

> **R1b.** Som en **gruppeleder**, ønsker jeg **å sende
> betalingsforespørsel via Vipps direkte fra appen**, slik at
> **deltakerne kan betale sin andel med étt trykk uten manuell
> overføring. \[Lav\]**

-   Gitt at splitten er klar, når brukeren trykker «Send
    > betalingsforespørsel», så genereres en Vipps-lenke med riktig
    > beløp til hver person.

-   Gitt at en deltaker har betalt via Vipps, når betalingen bekreftes,
    > så oppdateres statusen i appen automatisk.

> **R2.** Som en **turdeltaker**, ønsker jeg **å laste opp bilder til et
> delt turalbum**, slik at **vi samler alle bildene på étt sted i stedet
> for å sende dem i chat. \[Lav\]**

-   Gitt at turen er fullført, når en deltaker laster opp bilder, så
    > legges de til i et delt album synlig for alle i gruppen.

-   Gitt at flere deltakere laster opp, når albumet vises, så er bildene
    > sortert kronologisk med hvem som tok dem.

> **R3.** Som en **turplanlegger**, ønsker jeg **å gjenbruke en
> tidligere tur som mal for neste år**, slik at **vi slipper å planlegge
> alt fra bunnen av når vi vil gjenta turen. \[Medium\]**

-   Gitt at en tur er fullført og lagret, når brukeren trykker «Gjenta
    > denne turen», så opprettes en ny tur med samme rute, hytter og
    > deltakere, men med nye datoer.

-   Gitt at en gjentatt tur opprettes, når datoene velges, så sjekkes
    > tilgjengelighet på nytt for de nye datoene.

-   Gitt at en tur ble gjennomført for omtrent ett år siden, når
    > sesongen nærmer seg igjen, så får turplanleggeren et proaktivt
    > forslag om å gjenta turen med oppdaterte datoer.

> **R4.** Som en **turdeltaker**, ønsker jeg **å se turhistorikk og
> statistikk over mine gjennomførte turer**, slik at **jeg har en
> oversikt over hva jeg har gjort og kan dele det med andre. \[Lav\]**

-   Gitt at brukeren har gjennomført minst én tur, når historikksiden
    > åpnes, så vises alle turer med dato, rute, distanse og høydemeter.

-   Gitt at brukeren åpner en tidligere tur, når detaljene vises, så kan
    > hen se deltakere, bilder og pakkeliste fra den gang.

> **R5.** Som en **turdeltaker**, ønsker jeg **å skrive en kort
> anmeldelse av turen og dele den med fellesskapet**, slik at **andre
> brukere får førstehånds erfaringer som hjelper dem å velge tur.
> \[Lav\]**

-   Gitt at turen er fullført, når brukeren åpner «Skriv anmeldelse», så
    > kan hen gi poeng (1--5), velge tagger (f.eks. «familievennlig»,
    > «krevende») og skrive fritekst.

-   Gitt at anmeldelsen er publisert, når andre brukere ser den aktuelle
    > ruten, så vises anmeldelsen med dato, sesong og gruppestørrelse
    > som kontekst.

> **R6.** Som en **turdeltaker**, ønsker jeg **å se grafisk høydeprofil
> og samlet statistikk for gjennomførte turer**, slik at **jeg kan
> sammenligne turer over tid og se utviklingen min visuelt. \[Lav\]**

-   Gitt at en tur er fullført, når tursiden åpnes, så vises en graf med
    > høyde over avstand for hele ruten, med etapper markert.

-   Gitt at brukeren har gjennomført flere turer, når statistikksiden
    > åpnes, så vises samlet distanse, høydemeter og antall turer per
    > sesong.

-   Gitt at brukeren åpner statistikken, når de siste turene vises, så
    > kan hen sammenligne to turer side om side på høydeprofil og tempo.

## System og administrasjon

> **S1.** Som en **administrator**, ønsker jeg **å konfigurere
> API-nøkler og datakilde-tilganger for alle team**, slik at **ingen
> team trenger å bruke tid på autentisering på hackathon-dagen.
> \[Høy\]**

-   Gitt at et nytt team opprettes, når miljøvariablene settes, så har
    > teamet tilgang til alle forhåndskonfigurerte API-er.

-   Gitt at en API-nøkkel utløper under hackathonen, når feilen
    > oppdages, så logges den sentralt og administrator varsles.

> **S2.** Som en **administrator**, ønsker jeg **å tilby fallback-data
> når et eksternt API er nede eller utilgjengelig**, slik at **teamene
> kan jobbe videre selv om en datakilde feiler. \[Høy\]**

-   Gitt at DNT-APIet ikke svarer, når appen forsøker å hente hyttedata,
    > så brukes det forhåndslastede snapshot automatisk.

-   Gitt at fallback-data brukes, når dataene vises i appen, så markeres
    > det tydelig at dataene kan være utdaterte.

> **S3.** Som en **turplanlegger**, ønsker jeg **å få tydelig beskjed
> når AI foreslår noe versus når data er faktisk**, slik at **jeg stoler
> på det jeg ser og vet hva som er sikkert og hva som er anslag.
> \[Høy\]**

-   Gitt at AI genererer en pakkeliste, når listen vises, så er
    > AI-genererte elementer visuelt skilt fra brukerdefinerte.

-   Gitt at en værprognose har lav pålitelighet, når den vises, så er
    > usikkerheten synlig for brukeren.

-   Gitt at AI foreslår en alternativ rute, når forslaget vises, så
    > forklares kort hvorfor endringen er foreslått.

# MVP

Følgende 9 brukerhistorier utgjør MVPen:

**Discover:**

D1 (fritekstsøk med AI)

D2 (visning av DNT-hytter på kart)

**Decide:**

B1 (værvarsel for turperioden)

B3 (forslått rute mellom hytter)

B6 (tidslinje med etapper, overnattinger og transport)

**Gather:**

G1 (invitere deltakere og dele turplan)

**Prepare:**

P1 (AI-generert pakkeliste)

**Go:**

T1 (offline kart og ruteinformasjon)

**Return:**

R1 (utgiftsregistrering og splitt-beregning)

Disse 9 historiene gir en sammenhengende flyt der brukeren kan søke
etter turer, se dem på kart med værdata, planlegge rute og tidslinje,
invitere venner, generere pakkeliste, navigere offline, og gjøre opp
økonomien etterkant.

Team som blir ferdige med MVPen kan plukke ytterligere brukerhistorier
fra kapittel 8 for å utvide appen. Historiene er forsøkt splittet i så
uavhengige historier som mulig.
