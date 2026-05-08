interface TripPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Turdetaljer</h1>
      <p className="text-muted-foreground mb-8 font-mono text-sm">{id}</p>

      <div className="grid gap-6">
        <section className="rounded-lg border p-6">
          <h2 className="font-semibold text-lg mb-3">Tidslinje (B6)</h2>
          <div className="text-muted-foreground text-sm">Dag-for-dag etapper kommer her</div>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="font-semibold text-lg mb-3">Vær (B1)</h2>
          <div className="text-muted-foreground text-sm">Yr-varsel for turperioden kommer her</div>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="font-semibold text-lg mb-3">Deltakere (G1, G4)</h2>
          <div className="text-muted-foreground text-sm">Inviter og se status for deltakere her</div>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="font-semibold text-lg mb-3">Pakkeliste (P1)</h2>
          <div className="text-muted-foreground text-sm">AI-generert pakkeliste kommer her</div>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="font-semibold text-lg mb-3">Utgifter (R1)</h2>
          <div className="text-muted-foreground text-sm">Kostnadsregistrering og splitt kommer her</div>
        </section>
      </div>
    </main>
  );
}
