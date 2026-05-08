# Friluftskompis - Hackathon 2026

## Team Lag 7

- Une Krog
- Zaim Imran
- Jonas Lierstuen

## External resources

- Hackathon hub: https://hackathon.blank.no/
- Avion board: https://blank.avion.io/share/LXuAxH6skQb65ndHv
- Score submission site: https://hackathon.blank.no/lag/7

## Project docs

- [docs/Intro_til_Friluftskompis.md](docs/Intro_til_Friluftskompis.md) - case, scenarioer, produktvisjon, brukerreisens 6 faser.
- [docs/Brukerhistorier.md](docs/Brukerhistorier.md) - alle stories med Gitt/Når/Så-akseptansekriterier og prioritet. MVP er D1, D2, B1, B3, B6, G1, P1, T1, R1.

## Persona twist - Lars Monsen

Appen har Lars Monsen som vert. All AI-genererte tekster (Claude-kall: D1 søk, P1 pakkeliste, framtidig chat) skal bruke Monsen-stemme: lun, røff, tørrvittig, naturnær, bokmål. Memes og kjente sitat vevd inn i copy, tomstander, loading, toasts og pakkeliste-anbefalinger. Pakkelister, turforslag og råd lener mot minimalisme og friluftslivets enkle gleder. Hold tonen som "inspirert av", ikke offisiell merkevare. Sentral persona-prompt + sitatbank ligger i `src/lib/claude/persona.ts` og injiseres i alle Anthropic-kall.

## External APIs

Reference list from hackathon hub: https://hackathon.blank.no/apis. Status legend: ✅ wired, 🟡 planned, ⬜ not yet considered. Identify all server fetches with UA `Friluftskompis/1.0 (lag7@blank.no)`.

### Kartverket / Geonorge ✅ (open, no auth)

- WMTS topo tiles: `https://cache.kartverket.no/v1/wmts/1.0.0/{layer}/default/webmercator/{z}/{y}/{x}.png` - layers: `topo` (default), `topograatone`, `toporaster`. CORS enabled, cache 5d. License NLOD 2.0, attribution `© Kartverket`.
- Stedsnavn place search: `https://ws.geonorge.no/stedsnavn/v1/sted` - params `sok`, `treffPerSide`, `fuzzy=true`, `utkoordsys=4258`. Coordinates at `representasjonspunkt.nord` / `representasjonspunkt.øst` (UTF-8 `ø` in key).
- Throttled above ~20 req/s/IP. Wrapper lib `src/lib/kartverket/`, route `/api/search?q=...`.

### MET Norway / Yr 🟡 (open, UA required) — B1, B6

- Base: `https://api.met.no` (e.g. `/weatherapi/locationforecast/2.0/complete`, `/nowcast/2.0`).
- Required: User-Agent with app name + contact email. Generic UAs blocked. Rate limit 20 req/s/app. Respect `Expires` and `If-Modified-Since`.

### UT.no / DNT ✅ (open) — D1, D2, B3, B6

- GraphQL: `https://ut-backend-api-2-41145913385.europe-north1.run.app/internal/graphql`. Wrapper i `src/lib/ut/`.
- Auth ikke nødvendig. `Origin` ikke påkrevd, men send det og `Content-Type: application/json`. Introspection åpen.
- D1-søk bruker `search(input: { searchString, fullResult: true })`. Returnerer `prioritizedResult` + `result`, begge `[String!]!` semikolon-CSV: `prefix;id;lon,lat;name;subtype;extra`. Prefiks: `a` område, `d` hytte (extra `1` = DNT), `g` turforslag (Trip), `e` POI/fjelltopp.
- Hydrer detaljer via `cabin(id:)`, `trip(id:)`, `area(id:)`, `poi(id:)`. Trip har `geojson` + `encodedPolyline` + `cabinIds`. Bruk `*Near` for radius-spørringer.
- Koordinater alltid GeoJSON Point `[lon, lat]` (EPSG:4326). Cursor-paginering via `paging: { first, after }`.

### iNatur ⬜ (open) — D2b kommersielle hytter

- `https://www.inatur.no/internal/search`. 5 639 listings (pris, senger, fasiliteter, kommune).
- No coordinates returned; geokod via Kartverket Stedsnavn på kommunenavn.

### Entur 🟡 (open, header required) — B4, B12

- `https://api.entur.io` GraphQL journey planner. Header `ET-Client-Name: friluftskompis-lag7-blank`.
- Throttled hardt uten header. Stop search + sanntid avganger.

### Varsom / NVE ⬜ (open) — B7

- `https://api01.nve.no` for skred-, flom- og jordskredvarsel (faregrad 1-5). Oppdateres hver 30-60 min.
- Attribution `Varsler fra NVE/Varsom`.

### OpenStreetMap ⬜ (open, attribution req)

- Tiles `https://tile.openstreetmap.org` (cache lokalt, ikke hotlink). Overpass POI `https://overpass-api.de` (max 2 samtidige queries).
- Attribution `© OpenStreetMap contributors`.

### Miljødirektoratet ⬜ (open) — friluftsområder

- ArcGIS REST `https://kart.miljodirektoratet.no/arcgis/rest/services`. ESRI JSON geometri, konverter med terraformer/turf.

### Vegvesen Trafikdata + NVDB ⬜ (open) — B4

- Trafikdata GraphQL `https://trafikkdata-api.atlas.vegvesen.no/`.
- NVDB `https://nvdbapiles-v3.atlas.vegvesen.no` (rasteplasser, bomstasjoner). Send browser-like UA. Koordinater i UTM33/EPSG:25833 - reproj til WGS84.

### Anthropic Claude 🟡 (key required) — D1, P1

- `https://api.anthropic.com/v1/messages`, header `x-api-key`. Hver gruppe bruker eget Anthropic-konto.
- Modell-IDer per 2026: `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`. Default Sonnet 4.6 for chat/planning, Haiku 4.5 for raske svar, Opus 4.7 for tunge plan-task. Bruk prompt caching.

### Strava ⬜ (OAuth) — D8 inspirasjon, R6 statistikk

- `https://www.strava.com/api/v3`. OAuth 2.0, client_id/secret i Blank 1Password. Token 6 t, refresh-token gitt. Limits 200/15min, 2 000/dag.

### Google Maps Platform ⬜ (key i 1Password)

- Geocoding/Places/Directions/Maps JS. Vurder først om Kartverket + Overpass holder før vi bruker kvote.

### DATEX II v3 (Vegvesen sanntid) ⬜ (Basic Auth i 1Password)

- `https://datex-server-get-v3-1.atlas.vegvesen.no/datexapi/`. XML 5-20 MB, ikke poll oftere enn 60 s. Sanntids hendelser, fjellovergang-status, webcams.

### Apify Airbnb scraper ⬜ (token i 1Password) — D2b

- `https://api.apify.com/v2/acts/NDa1latMI7JHJzSYU/runs`. ~240 hits/query, $1.25/1000 results.

## MVP API mapping

- D1 søk → Kartverket Stedsnavn (✅) + UT.no for hytte/rute-treff + Claude for AI-rangering.
- D2 hyttelag → UT.no (DNT) + Kartverket basemap.
- B1 vær → MET Norway locationforecast.
- B3 rute mellom hytter → UT.no rutedata + evt. egen distanse/elevation-kalk.
- B6 tidslinje → kombinasjon B1 + B3.
- G1 invitasjonslenke → eget backend (MongoDB inviteToken finnes alt).
- P1 pakkeliste → Claude (Sonnet 4.6) basert på MET-vær + turlengde + deltakere.
- T1 offline kart → cache Kartverket-tiles via Service Worker / PMTiles.
- R1 kostnadssplit → eget backend.

