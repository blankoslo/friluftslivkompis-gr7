"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { randomQuip } from "@/lib/lars-monsen/quips";

const FEMUNDSMARKA_LOCATION = { lat: 62.18, lng: 11.85 };

function defaultDates() {
  const start = new Date();
  start.setMonth(start.getMonth() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 2);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function LarsForeslarPage() {
  const router = useRouter();
  const [organizer, setOrganizer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTrip() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { startDate, endDate } = defaultDates();
      const payload: Record<string, unknown> = {
        title: "Femundsmarka, 2 måneder",
        area: "Femundsmarka",
        phase: "gather",
        startDate,
        endDate,
        location: FEMUNDSMARKA_LOCATION,
      };
      if (organizer.trim()) {
        payload.participants = [
          { name: organizer.trim(), status: "accepted" },
        ];
      }

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Kunne ikke opprette tur");
      }
      const trip = await res.json();

      try {
        await fetch(`/api/trips/${trip._id}/cabins/auto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: FEMUNDSMARKA_LOCATION.lat,
            lon: FEMUNDSMARKA_LOCATION.lng,
            count: 3,
          }),
        });
      } catch {}

      try {
        sessionStorage.setItem(
          "monsenToast",
          JSON.stringify({ quip: randomQuip("tripCreated"), at: Date.now() }),
        );
      } catch {}
      router.push(`/tur/${trip._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
      setSubmitting(false);
    }
  }

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
              Hør her, gutt.
            </p>
            <h2 className="font-heading font-black text-3xl mb-sm leading-tight">
              Femundsmarka, mitt andre hjem
            </h2>
            <p className="text-sm font-bold uppercase tracking-label text-flame-pressed mb-md">
              2 måneder · furuskog, kano, stillhet
            </p>

            <p className="text-base leading-relaxed mb-md">
              Du trenger ikke fly over havet for å finne villmark. Femundsmarka
              ligger der den alltid har ligget, mellom Røros og svenskegrensa.
              Furuskog så langt øyet rekker, vann som henger sammen i et nett
              du kan padle i ukevis, og bjørn nok til å holde deg våken. To
              måneder er akkurat passe til å begynne å forstå plassen.
            </p>

            <ul className="space-y-1 text-sm mb-md">
              <li>
                <strong>Når:</strong> juni - august, lange lyse kvelder.
              </li>
              <li>
                <strong>Hvor:</strong> Elgå inn, kano gjennom Røa og Femund,
                videre nordover mot Svukuriset.
              </li>
              <li>
                <strong>Pakk:</strong> kano, telt, øks, fiskestang, mygg-net.
              </li>
              <li>
                <strong>Selskap:</strong> en god turkamerat. Eller hund.
              </li>
            </ul>

            <blockquote
              className="bg-flame-primary/10 border-l-4 border-flame-primary px-md py-sm mb-md rounded-r"
              style={{ fontFamily: "var(--font-handwriting)" }}
            >
              <p className="text-lg leading-snug text-text-primary">
                &ldquo;Femundsmarka er det nærmeste jeg kommer hjem uten å gå
                gjennom døra mi.&rdquo;
              </p>
              <p className="text-sm text-flame-pressed mt-1">- Lars Monsen</p>
            </blockquote>

            <label
              htmlFor="organizer"
              className="block space-y-xs mb-md"
            >
              <span
                className="text-small text-flame-pressed tracking-label uppercase font-bold"
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                Ditt navn (valgfritt)
              </span>
              <input
                id="organizer"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Vises som turplanlegger"
                className="w-full rounded-md border-2 border-flame-pressed bg-bg px-md py-sm text-body text-text-primary font-semibold placeholder:text-flame-primary/50 focus:outline-none focus:ring-2 focus:ring-flame-primary"
              />
            </label>

            {error && (
              <p className="text-small text-warning bg-warning-bg border-2 border-warning-border rounded-md px-md py-sm font-semibold mb-md">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={createTrip}
              disabled={submitting}
              className="block w-full text-center rounded-md bg-flame-primary px-md py-md text-base font-bold text-white hover:bg-flame-hover active:bg-flame-pressed shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Tenner bålet..."
                : "Opprett tur og inviter venner →"}
            </button>
            <p className="text-xs text-text-secondary mt-sm text-center">
              Du havner rett i turplanleggeren. Inviter venner med lenke.
            </p>
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
            &ldquo;Furua står stille. Du må gå til den.&rdquo;
          </p>
          <p className="text-sm opacity-75">- Lars Monsen</p>
        </footer>
      </div>
    </main>
  );
}
