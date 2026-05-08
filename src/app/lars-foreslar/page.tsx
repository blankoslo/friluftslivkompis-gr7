import Image from "next/image";
import Link from "next/link";

export default function LarsForeslarPage() {
  return (
    <main className="bg-flame-primary text-white relative overflow-hidden min-h-screen">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.06), transparent 50%), radial-gradient(circle at 80% 100%, rgba(0,0,0,0.12), transparent 50%)",
        }}
      />

      <div className="relative max-w-[42rem] mx-auto px-md py-xl sm:px-lg sm:py-2xl">
        <header className="mb-lg">
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-label underline underline-offset-4 opacity-90 hover:opacity-100"
          >
            ← Tilbake
          </Link>
        </header>

        <h1
          className="font-heading font-bold leading-[0.95] mb-md"
          style={{ fontSize: "clamp(40px, 9vw, 64px)" }}
        >
          Lars foreslår
        </h1>

        <section className="bg-bg text-text-primary border-4 border-flame-pressed rounded-lg overflow-hidden mb-lg shadow-[6px_6px_0_var(--brand-flame-pressed)]">
          <div className="relative h-56 sm:h-72">
            <Image
              src="/lars-monsen.jpg"
              alt="Lars Monsen"
              fill
              className="object-cover"
              priority
            />
            <span
              className="absolute top-3 left-3 bg-forest text-white text-xs font-bold px-sm py-1 rounded border-2 border-forest uppercase tracking-label"
              style={{
                fontFamily: "var(--font-stamp)",
                transform: "rotate(-3deg)",
              }}
            >
              LARS MONSEN GODKJENT
            </span>
          </div>

          <div className="p-lg">
            <p
              className="text-flame-pressed text-base mb-1"
              style={{ fontFamily: "var(--font-handwriting)" }}
            >
              Jeg har tenkt litt, gutt.
            </p>
            <h2 className="font-heading font-black text-3xl mb-sm leading-tight">
              Canada på tvers
            </h2>
            <p className="text-sm font-bold uppercase tracking-label text-flame-pressed mb-md">
              3 måneder · Yukon → Northwest Territories
            </p>

            <p className="text-base leading-relaxed mb-md">
              Glem helgetur. Glem hytte-til-hytte. Det ekte eventyret venter
              vest for Whitehorse. Tre måneder, kano, kompass og stillhet du
              kan høre. Du sover under nordlys, koker kaffe på bål, og lærer
              hva selvberging betyr i praksis.
            </p>

            <ul className="space-y-1 text-sm mb-md">
              <li>
                <strong>Når:</strong> juni - august, midnattssol hele veien.
              </li>
              <li>
                <strong>Hvor:</strong> Yukon-elva fra Whitehorse til Dawson,
                videre nord mot Mackenzie-deltaet.
              </li>
              <li>
                <strong>Pakk:</strong> kano, telt, fiskestang, røykt fenalår.
              </li>
              <li>
                <strong>Selskap:</strong> deg selv. Maks én tursj.
              </li>
            </ul>

            <blockquote
              className="bg-flame-primary/10 border-l-4 border-flame-primary px-md py-sm mb-md rounded-r"
              style={{ fontFamily: "var(--font-handwriting)" }}
            >
              <p className="text-lg leading-snug text-text-primary">
                &ldquo;Er du sikker på at du ikke vil ta Canada på tvers? Det
                er bare 6 000 km.&rdquo;
              </p>
              <p className="text-sm text-flame-pressed mt-1">- Lars Monsen</p>
            </blockquote>

            <Link
              href="/discover?q=canada"
              className="block w-full text-center rounded-md bg-flame-primary px-md py-md text-base font-bold text-white hover:bg-flame-hover active:bg-flame-pressed shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-transform"
            >
              Bli med på Canada på tvers →
            </Link>
          </div>
        </section>

        <footer className="text-center pb-xl">
          <p
            className="text-xl opacity-95 mb-1"
            style={{
              fontFamily: "var(--font-handwriting)",
              fontWeight: 700,
            }}
          >
            &ldquo;Norske fjell er fine. Canada er hjemme.&rdquo;
          </p>
          <p className="text-sm opacity-75">- Lars Monsen</p>
        </footer>
      </div>
    </main>
  );
}
