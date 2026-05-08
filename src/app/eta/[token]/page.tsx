import { notFound } from "next/navigation";
import Link from "next/link";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type IEtaShare } from "@/models/Trip";
import {
  computeEtaStatus,
  ETA_DELAY_THRESHOLD_MINUTES,
  type EtaStatus,
} from "@/lib/eta/status";
import { EtaAutoRefresh } from "./auto-refresh";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface EtaView {
  tripTitle: string;
  tripArea: string;
  contactName: string;
  expectedReturnAt: string;
  status: EtaStatus;
  delayMinutes: number;
  completedAt: string | null;
  enabled: boolean;
}

async function loadByToken(token: string): Promise<EtaView | null> {
  await connectToDatabase();
  const doc = await Trip.findOne({ "etaShare.token": token }).lean<{
    title: string;
    area?: string;
    etaShare?: IEtaShare;
  } | null>();
  if (!doc?.etaShare) return null;
  const eta = doc.etaShare;
  const status = computeEtaStatus({
    expectedReturnAt: new Date(eta.expectedReturnAt),
    now: new Date(),
    completedAt: eta.completedAt ? new Date(eta.completedAt) : null,
  });
  return {
    tripTitle: doc.title,
    tripArea: doc.area ?? "",
    contactName: eta.contactName,
    expectedReturnAt: new Date(eta.expectedReturnAt).toISOString(),
    status: status.status,
    delayMinutes: status.delayMinutes,
    completedAt: eta.completedAt ? new Date(eta.completedAt).toISOString() : null,
    enabled: eta.enabled,
  };
}

const STATUS_LABEL: Record<EtaStatus, string> = {
  planlagt: "Planlagt",
  "pa-tur": "På tur",
  forsinket: "Forsinket",
  hjemme: "Hjemme",
};

const STATUS_TONE: Record<EtaStatus, string> = {
  planlagt: "bg-bg-secondary text-text-primary border-border",
  "pa-tur": "bg-fjord-tint text-fjord border-fjord",
  forsinket: "bg-warning-bg text-warning border-warning",
  hjemme: "bg-forest-tint text-forest border-forest",
};

const STATUS_BLURB: Record<EtaStatus, string> = {
  planlagt: "Turen har ikke startet enda. Du blir varslet når status endrer seg.",
  "pa-tur":
    "Personen er på tur. Forventet hjem som angitt. Følg med, men ikke ring 113 enda.",
  forsinket:
    "Forsinkelsen er over terskelen. Prøv å ringe først. Hvis du ikke får tak, vurder å varsle 113.",
  hjemme: "Personen er trygt hjemme. Du kan slappe av.",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDelay(minutes: number): string {
  const abs = Math.abs(minutes);
  if (abs < 60) return `${abs} min`;
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (m === 0) return `${h} t`;
  return `${h} t ${m} min`;
}

export default async function EtaPublicPage({ params }: PageProps) {
  const { token } = await params;
  const view = await loadByToken(token);
  if (!view) notFound();

  const isDelayed = view.status === "forsinket";
  const isHome = view.status === "hjemme";

  return (
    <main className="bg-bg min-h-screen">
      <EtaAutoRefresh intervalMs={60000} />
      <div className="mx-auto flex max-w-[42rem] flex-col gap-md px-md py-xl sm:px-lg sm:py-2xl">
        <header className="flex flex-col gap-xs">
          <p
            className="text-xs font-bold uppercase tracking-label text-flame-pressed"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            ETA-deling
          </p>
          <h1 className="font-heading text-3xl font-black leading-tight text-text-primary sm:text-4xl">
            {view.tripTitle}
          </h1>
          {view.tripArea && (
            <p className="text-sm text-text-muted">{view.tripArea}</p>
          )}
        </header>

        <section
          className={`rounded-lg border-4 p-lg ${STATUS_TONE[view.status]}`}
        >
          <p
            className="text-xs font-bold uppercase tracking-label"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            Status
          </p>
          <p className="mt-xs font-heading text-4xl font-black leading-tight">
            {STATUS_LABEL[view.status]}
          </p>
          {isDelayed && (
            <p className="mt-sm text-base font-bold">
              {formatDelay(view.delayMinutes)} forsinket (terskel{" "}
              {ETA_DELAY_THRESHOLD_MINUTES} min).
            </p>
          )}
          {!isDelayed && !isHome && view.delayMinutes < 0 && (
            <p className="mt-sm text-base">
              Cirka {formatDelay(view.delayMinutes)} til ETA.
            </p>
          )}
          <p className="mt-sm text-sm leading-snug">
            {STATUS_BLURB[view.status]}
          </p>
        </section>

        <section className="rounded-lg border-2 border-border bg-bg p-lg">
          <h2 className="font-heading text-h3 font-bold text-forest">
            Detaljer
          </h2>
          <dl className="mt-sm grid grid-cols-1 gap-sm text-base sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-label text-text-muted">
                Forventet hjem
              </dt>
              <dd className="font-bold text-text-primary">
                {formatDateTime(view.expectedReturnAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-label text-text-muted">
                Kontaktperson
              </dt>
              <dd className="font-bold text-text-primary">
                {view.contactName}
              </dd>
            </div>
            {view.completedAt && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-label text-text-muted">
                  Hjemme
                </dt>
                <dd className="font-bold text-forest">
                  {formatDateTime(view.completedAt)}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {!isHome && (
          <section className="rounded-lg border-4 border-warning bg-warning-bg p-lg">
            <h2 className="font-heading text-h3 font-bold text-warning">
              Hvis det haster
            </h2>
            <p className="mt-xs text-sm text-text-primary">
              Prøv å ringe personen selv først. Får du ikke svar og turen er
              vesentlig forsinket, ring nødetaten.
            </p>
            <div className="mt-md flex flex-wrap gap-sm">
              <a
                href="tel:113"
                className="inline-flex items-center gap-xs rounded-md border-2 border-warning bg-warning px-lg py-sm text-base font-bold text-white shadow-[3px_3px_0_var(--accent-warning)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--accent-warning)] transition-transform"
              >
                Ring 113
              </a>
              <Link
                href="https://www.hovedredningssentralen.no/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-xs rounded-md border-2 border-fjord bg-bg px-md py-sm text-sm font-bold text-fjord"
              >
                Hovedredningssentralen
              </Link>
            </div>
          </section>
        )}

        <p className="text-center text-xs text-text-muted">
          Friluftskompis ETA-deling. Siden oppdateres automatisk hvert minutt.
        </p>
      </div>
    </main>
  );
}
