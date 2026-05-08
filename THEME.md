# Lars Monsen Design System

Fargepalett inspirert av norsk villmark, ild og natur. Versjon 1.0.0. Tokens følger [W3C Design Tokens Format](https://design-tokens.github.io/community-group/format/). Light + dark theme.

**Bindende:** All UI-kode i Friluftskompis MÅ bruke disse tokens. Ingen hardkodede hex, raw px-spacing, eller ad-hoc Tailwind-farger utenfor mappingen. Hvis et token mangler for et behov, utvid denne filen først, deretter bruk det.

## How to use

- CSS custom properties: kanonisk kilde i `src/design/tokens.css` (`:root` + `.dark`). Importeres av `src/app/globals.css`.
- Tailwind v4: tokens eksponeres som utilities via `@theme inline` i `src/app/globals.css`. Tailwind v4 har INGEN `tailwind.config.ts` — alt deklareres i CSS.
- Komponenter: bruk `bg-flame-primary`, `text-text-primary`, `border-border`, `bg-surface`, `text-text-muted` osv. Aldri `bg-[#C8602A]` eller raw hex.
- Dark mode: toggle ved å sette `class="dark"` på `<html>` (shadcn-konvensjon). Tokens som har samme verdi i begge moduser (f.eks. `text-muted` `#7A6F63`) er bevisst.

### Tilgjengelige Tailwind-utilities (v4)

| Token | Tailwind class |
|---|---|
| Brand | `bg-flame-primary` (alias `bg-flame`), `bg-flame-hover`, `bg-flame-pressed`, `bg-flame-tint` |
| Neutral | `bg-bg`, `bg-surface`, `border-border`, `text-text-primary`, `text-text-muted`, `text-text-disabled` |
| Accent | `bg-forest`, `bg-forest-tint`, `bg-fjord`, `bg-fjord-tint`, `bg-midnight-sun`, `bg-midnight-sun-tint` |
| Semantic | `bg-success`, `bg-info`, `bg-warning`, `bg-warning-bg`, `border-warning-border` |
| Typography size | `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-small` |
| Font family | `font-heading`, `font-body`, `font-sans`, `font-mono` |
| Spacing | `p-xs`, `p-sm`, `p-md`, `p-lg`, `p-xl`, `p-2xl` (også `m-*`, `gap-*` osv) |
| Radius | `rounded-sm` (3px), `rounded-md` (5px), `rounded-lg` (10px), `rounded-pill` (12px) |
| Tracking | `tracking-label` (0.12em — labels og tags) |

shadcn-variabler (`--primary`, `--background`, `--card`, `--ring`, ...) er allerede mappet til LM-tokens, så `Button`/`Card`/etc. henter riktig farge automatisk.

## Brand — Bål og glød

| Token | Light | Dark | Bruk |
|---|---|---|---|
| `flame-primary` | `#C8602A` | `#E8702F` | Primærknapper, CTA. Bålflame. |
| `flame-hover` | `#A04A1E` | `#C8602A` | Hover. Emberglød. |
| `flame-pressed` | `#7A3515` | `#A04A1E` | Pressed/aktiv. Rustbrun. |
| `flame-tint` | `#FAEADE` | `#3A2410` | Tint-bg, tags. Gløresten. |

## Neutral — Bjørk og natt

| Token | Light | Dark | Bruk |
|---|---|---|---|
| `bg` | `#FAF7F2` | `#1A1612` | Sidebakgrunn. Bjørkehvit / Nattmørket. |
| `surface` | `#F0EBE0` | `#2A2118` | Kort, flater. Lynghei / Lavvubrunt. |
| `border` | `#D6CCBF` | `#4A3E34` | Kanter, separatorer. Elveleire / Trestamme. |
| `text-primary` | `#2A211A` | `#F0EBE3` | Primær tekst. Skogbunn / Bjørkesnø. |
| `text-muted` | `#7A6F63` | `#7A6F63` | Sekundær tekst, labels. Reinlav. |
| `text-disabled` | `#D6CCBF` | `#4A3E34` | Deaktivert tekst. |

## Accent — Skog, fjord, midnattsol

| Token | Light | Dark | Bruk |
|---|---|---|---|
| `forest` | `#3D5E35` | `#4A6741` | Suksess, natur-aksent. Granskog. |
| `forest-tint` | `#E8F0E6` | `#1E2E1C` | Tinted natur-bg. |
| `fjord` | `#3D6475` | `#5A7A8A` | Info, linker. Fjordblå. |
| `fjord-tint` | `#E0ECF0` | `#1A2830` | Tinted fjord-bg. |
| `midnight-sun` | `#B8891E` | `#D4A853` | Varsel, highlight. Midnattsol. |
| `midnight-sun-tint` | `#FBF3DC` | `#2E2810` | Tinted midnattsol-bg. |

## Semantic states

| Token | Light | Dark | Bruk |
|---|---|---|---|
| `success` | `#3D5E35` | `#4A6741` | Suksess. |
| `info` | `#3D6475` | `#5A7A8A` | Info. |
| `warning` | `#A04A1E` | `#E8702F` | Advarsel. |
| `warning-bg` | `#FAEADE` | `#2A1A10` | Advarsel bg. |
| `warning-border` | `#E8702F` | `#A04A1E` | Advarsel kant. |

## Button tokens

Identisk i begge moduser med mindre annet er angitt.

| Token | Light | Dark | Bruk |
|---|---|---|---|
| `button.primary-bg` | `#C8602A` | `#C8602A` | Primær bg. |
| `button.primary-bg-hover` | `#A04A1E` | `#A04A1E` | Primær hover. |
| `button.primary-text` | `#FFFFFF` | `#FFFFFF` | Primær tekst. |
| `button.secondary-border` | `#C8602A` | `#C8602A` | Sekundær kant. |
| `button.secondary-text` | `#C8602A` | `#C8602A` | Sekundær tekst. |
| `button.ghost-border` | `#D6CCBF` | `#4A3E34` | Ghost kant. |
| `button.ghost-text` | `#7A6F63` | `#7A6F63` | Ghost tekst. |

## Typography

| Token | Verdi |
|---|---|
| `font-heading` | `Georgia, 'Playfair Display', serif` (robust, klassisk) |
| `font-body` | `'Source Sans Pro', Inter, sans-serif` (lesbar, solid) |
| `font-mono` | `'Courier New', monospace` (kode, hex) |
| `size-h1` | `32px` |
| `size-h2` | `24px` |
| `size-h3` | `20px` |
| `size-body` | `16px` |
| `size-small` | `12px` |
| `letter-spacing-wide` | `0.12em` (labels, tags) |

## Spacing scale

| Token | Verdi |
|---|---|
| `xs` | `4px` |
| `sm` | `8px` |
| `md` | `16px` |
| `lg` | `24px` |
| `xl` | `32px` |
| `2xl` | `48px` |

## Border radius

| Token | Verdi |
|---|---|
| `sm` | `3px` |
| `md` | `5px` |
| `lg` | `10px` |
| `pill` | `12px` |

## Source of truth

Kanonisk JSON kilde (Design Tokens Community Group format) under skal speile denne filen. Hvis JSON og tabell divergerer, oppdater begge.

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "$metadata": {
    "name": "Lars Monsen Design System",
    "description": "Fargepalett inspirert av norsk villmark, ild og natur",
    "version": "1.0.0",
    "themes": ["light", "dark"]
  },
  "brand": {
    "flame-primary": { "$type": "color", "$value": { "light": "#C8602A", "dark": "#E8702F" } },
    "flame-hover": { "$type": "color", "$value": { "light": "#A04A1E", "dark": "#C8602A" } },
    "flame-pressed": { "$type": "color", "$value": { "light": "#7A3515", "dark": "#A04A1E" } },
    "flame-tint": { "$type": "color", "$value": { "light": "#FAEADE", "dark": "#3A2410" } }
  },
  "neutral": {
    "bg": { "$type": "color", "$value": { "light": "#FAF7F2", "dark": "#1A1612" } },
    "surface": { "$type": "color", "$value": { "light": "#F0EBE0", "dark": "#2A2118" } },
    "border": { "$type": "color", "$value": { "light": "#D6CCBF", "dark": "#4A3E34" } },
    "text-primary": { "$type": "color", "$value": { "light": "#2A211A", "dark": "#F0EBE3" } },
    "text-muted": { "$type": "color", "$value": { "light": "#7A6F63", "dark": "#7A6F63" } },
    "text-disabled": { "$type": "color", "$value": { "light": "#D6CCBF", "dark": "#4A3E34" } }
  },
  "accent": {
    "forest": { "$type": "color", "$value": { "light": "#3D5E35", "dark": "#4A6741" } },
    "forest-tint": { "$type": "color", "$value": { "light": "#E8F0E6", "dark": "#1E2E1C" } },
    "fjord": { "$type": "color", "$value": { "light": "#3D6475", "dark": "#5A7A8A" } },
    "fjord-tint": { "$type": "color", "$value": { "light": "#E0ECF0", "dark": "#1A2830" } },
    "midnight-sun": { "$type": "color", "$value": { "light": "#B8891E", "dark": "#D4A853" } },
    "midnight-sun-tint": { "$type": "color", "$value": { "light": "#FBF3DC", "dark": "#2E2810" } }
  },
  "semantic": {
    "success": { "$type": "color", "$value": { "light": "#3D5E35", "dark": "#4A6741" } },
    "info": { "$type": "color", "$value": { "light": "#3D6475", "dark": "#5A7A8A" } },
    "warning": { "$type": "color", "$value": { "light": "#A04A1E", "dark": "#E8702F" } },
    "warning-bg": { "$type": "color", "$value": { "light": "#FAEADE", "dark": "#2A1A10" } },
    "warning-border": { "$type": "color", "$value": { "light": "#E8702F", "dark": "#A04A1E" } }
  },
  "button": {
    "primary-bg": { "$type": "color", "$value": { "light": "#C8602A", "dark": "#C8602A" } },
    "primary-bg-hover": { "$type": "color", "$value": { "light": "#A04A1E", "dark": "#A04A1E" } },
    "primary-text": { "$type": "color", "$value": { "light": "#FFFFFF", "dark": "#FFFFFF" } },
    "secondary-border": { "$type": "color", "$value": { "light": "#C8602A", "dark": "#C8602A" } },
    "secondary-text": { "$type": "color", "$value": { "light": "#C8602A", "dark": "#C8602A" } },
    "ghost-border": { "$type": "color", "$value": { "light": "#D6CCBF", "dark": "#4A3E34" } },
    "ghost-text": { "$type": "color", "$value": { "light": "#7A6F63", "dark": "#7A6F63" } }
  },
  "typography": {
    "font-heading": { "$type": "fontFamily", "$value": "Georgia, 'Playfair Display', serif" },
    "font-body": { "$type": "fontFamily", "$value": "'Source Sans Pro', Inter, sans-serif" },
    "font-mono": { "$type": "fontFamily", "$value": "'Courier New', monospace" },
    "size-h1": { "$type": "dimension", "$value": "32px" },
    "size-h2": { "$type": "dimension", "$value": "24px" },
    "size-h3": { "$type": "dimension", "$value": "20px" },
    "size-body": { "$type": "dimension", "$value": "16px" },
    "size-small": { "$type": "dimension", "$value": "12px" },
    "letter-spacing-wide": { "$type": "dimension", "$value": "0.12em" }
  },
  "spacing": {
    "xs": { "$type": "dimension", "$value": "4px" },
    "sm": { "$type": "dimension", "$value": "8px" },
    "md": { "$type": "dimension", "$value": "16px" },
    "lg": { "$type": "dimension", "$value": "24px" },
    "xl": { "$type": "dimension", "$value": "32px" },
    "2xl": { "$type": "dimension", "$value": "48px" }
  },
  "border-radius": {
    "sm": { "$type": "dimension", "$value": "3px" },
    "md": { "$type": "dimension", "$value": "5px" },
    "lg": { "$type": "dimension", "$value": "10px" },
    "pill": { "$type": "dimension", "$value": "12px" }
  }
}
```
