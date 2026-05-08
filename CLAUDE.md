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

## External APIs

### Kartverket (open, no auth)

- WMTS topo tiles: `https://cache.kartverket.no/v1/wmts/1.0.0/{layer}/default/webmercator/{z}/{y}/{x}.png` - layers: `topo` (default), `topograatone`, `toporaster`. CORS enabled, cache 5d. License: NLOD 2.0, attribution `© Kartverket`.
- Stedsnavn place search: `https://ws.geonorge.no/stedsnavn/v1/sted` - params `sok`, `treffPerSide`, `fuzzy=true`, `utkoordsys=4258` for lat/lon. Coordinates returned as `representasjonspunkt.nord` / `representasjonspunkt.øst` (note `ø` in key).
- Server-side fetches must send `User-Agent: Friluftskompis/1.0 (lag7@blank.no)`. No rate limit published, throttled above ~20 req/s/IP.
- Wrapper lib: `src/lib/kartverket/`. Search route: `/api/search?q=...`.

