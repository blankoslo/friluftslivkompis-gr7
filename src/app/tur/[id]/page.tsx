interface TripPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="font-heading text-3xl font-bold mb-2 text-foreground">Turdetaljer</h1>
      <p className="text-muted-foreground mb-8 font-mono text-sm">{id}</p>

      <div className="grid gap-4">
        <Section label="Tidslinje" badge="B6" accent="fjord">
          Dag-for-dag etapper kommer her
        </Section>
        <Section label="Vær" badge="B1" accent="fjord">
          Yr-varsel for turperioden kommer her
        </Section>
        <Section label="Deltakere" badge="G1, G4" accent="forest">
          Inviter og se status for deltakere her
        </Section>
        <Section label="Pakkeliste" badge="P1" accent="midnight-sun">
          AI-generert pakkeliste kommer her
        </Section>
        <Section label="Utgifter" badge="R1" accent="flame">
          Kostnadsregistrering og splitt kommer her
        </Section>
      </div>
    </main>
  );
}

type Accent = "flame" | "forest" | "fjord" | "midnight-sun";

const accentStyles: Record<Accent, { border: string; badge: string; heading: string }> = {
  flame: {
    border: "border-flame/30",
    badge: "bg-flame-tint text-flame",
    heading: "text-flame",
  },
  forest: {
    border: "border-forest/30",
    badge: "bg-forest-tint text-forest",
    heading: "text-forest",
  },
  fjord: {
    border: "border-fjord/30",
    badge: "bg-fjord-tint text-fjord",
    heading: "text-fjord",
  },
  "midnight-sun": {
    border: "border-midnight-sun/30",
    badge: "bg-midnight-sun-tint text-midnight-sun",
    heading: "text-midnight-sun",
  },
};

function Section({
  label,
  badge,
  accent,
  children,
}: {
  label: string;
  badge: string;
  accent: Accent;
  children: React.ReactNode;
}) {
  const styles = accentStyles[accent];
  return (
    <section className={`rounded-md border ${styles.border} bg-surface p-6`}>
      <div className="flex items-center gap-2 mb-3">
        <h2 className={`font-heading font-semibold text-lg ${styles.heading}`}>{label}</h2>
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${styles.badge}`}>
          {badge}
        </span>
      </div>
      <div className="text-muted-foreground text-sm">{children}</div>
    </section>
  );
}
