import { cn } from "@/lib/utils";

const SYMBOL_LABEL: Record<string, string> = {
  clearsky: "Klart",
  fair: "Lettskyet",
  partlycloudy: "Delvis skyet",
  cloudy: "Skyet",
  fog: "Tåke",
  lightrain: "Lett regn",
  rain: "Regn",
  heavyrain: "Mye regn",
  lightsleet: "Lett sludd",
  sleet: "Sludd",
  heavysleet: "Mye sludd",
  lightsnow: "Lett snø",
  snow: "Snø",
  heavysnow: "Mye snø",
  rainshowers: "Regnbyger",
  snowshowers: "Snøbyger",
  sleetshowers: "Sluddbyger",
  thunderstorm: "Torden",
};

const SYMBOL_GLYPH: Record<string, string> = {
  clearsky: "☀",
  fair: "🌤",
  partlycloudy: "⛅",
  cloudy: "☁",
  fog: "🌫",
  lightrain: "🌦",
  rain: "🌧",
  heavyrain: "🌧",
  lightsleet: "🌨",
  sleet: "🌨",
  heavysleet: "🌨",
  lightsnow: "❄",
  snow: "❄",
  heavysnow: "❄",
  rainshowers: "🌦",
  snowshowers: "❄",
  sleetshowers: "🌨",
  thunderstorm: "⛈",
};

function baseCode(code: string | null): string | null {
  if (!code) return null;
  return code
    .replace(/_day$/, "")
    .replace(/_night$/, "")
    .replace(/_polartwilight$/, "");
}

export function weatherLabel(code: string | null): string {
  const base = baseCode(code);
  if (!base) return "Ukjent";
  return SYMBOL_LABEL[base] ?? base;
}

export function WeatherSymbol({
  code,
  className,
}: {
  code: string | null;
  className?: string;
}) {
  const base = baseCode(code);
  const glyph = base ? (SYMBOL_GLYPH[base] ?? "·") : "·";
  return (
    <span
      aria-label={weatherLabel(code)}
      title={weatherLabel(code)}
      className={cn("inline-flex items-center justify-center text-2xl leading-none", className)}
    >
      {glyph}
    </span>
  );
}
