import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Friluftskompis</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Alt du trenger for å planlegge fjellturen — fra idé til etterarbeid —
          på ett sted.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/tur/ny"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Start en ny tur
        </Link>
        <Link
          href="/discover"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          Utforsk turer
        </Link>
      </div>

      <nav className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg w-full mt-4">
        {phases.map(({ href, label, emoji, description }) => (
          <Link
            key={label}
            href={href}
            className="rounded-lg border p-4 text-left hover:bg-accent transition-colors"
          >
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="font-semibold text-sm">{label}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </Link>
        ))}
      </nav>
    </main>
  );
}

const phases = [
  {
    href: "/discover",
    emoji: "🗺️",
    label: "Discover",
    description: "Finn turer og hytter",
  },
  {
    href: "/tur/ny",
    emoji: "📅",
    label: "Decide",
    description: "Vær, rute og datoer",
  },
  {
    href: "/tur/ny",
    emoji: "👥",
    label: "Gather",
    description: "Inviter og koordiner",
  },
  {
    href: "/tur/ny",
    emoji: "🎒",
    label: "Prepare",
    description: "Pakkeliste og utstyr",
  },
  {
    href: "/tur/ny",
    emoji: "⛰️",
    label: "Go",
    description: "Kart og navigasjon",
  },
  {
    href: "/logg",
    emoji: "🧾",
    label: "Return",
    description: "Splitt og historikk",
  },
];
