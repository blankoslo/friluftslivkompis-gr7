import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-8 text-center">
      <div className="space-y-3">
        <h1 className="font-heading text-5xl font-bold tracking-tight text-foreground">
          Friluftskompis
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
          Alt du trenger for å planlegge fjellturen — fra idé til etterarbeid —
          på ett sted.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/tur/ny"
          className="inline-flex h-11 items-center justify-center rounded-md bg-flame px-6 text-sm font-medium text-white transition-colors hover:bg-flame-hover active:bg-flame-pressed"
        >
          Start en ny tur
        </Link>
        <Link
          href="/discover"
          className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-6 text-sm font-medium text-foreground transition-colors hover:bg-flame-tint hover:border-flame hover:text-flame"
        >
          Utforsk turer
        </Link>
      </div>

      <nav className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg w-full">
        {phases.map(({ href, label, emoji, description }) => (
          <Link
            key={label}
            href={href}
            className="rounded-md border border-border bg-surface p-4 text-left transition-colors hover:bg-flame-tint hover:border-flame"
          >
            <div className="text-2xl mb-2">{emoji}</div>
            <div className="font-heading font-semibold text-sm text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
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
