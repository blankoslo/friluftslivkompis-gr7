import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type IEtaShare } from "@/models/Trip";
import {
  EtaSharePanel,
  type EtaShareView,
} from "@/components/eta/eta-share-panel";
import { randomQuip } from "@/lib/lars-monsen/quips";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface View {
  _id: string;
  title: string;
  area: string;
  startDate?: string;
  endDate?: string;
  defaultExpectedReturnAt: string;
  etaShare: EtaShareView | null;
}

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

function defaultExpectedReturn(
  startDate: Date | undefined,
  endDate: Date | undefined,
): string {
  const base = endDate ?? startDate ?? new Date();
  const d = new Date(base);
  d.setHours(18, 0, 0, 0);
  if (!endDate && !startDate) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

async function loadView(id: string): Promise<View | null> {
  await connectToDatabase();
  const doc = await Trip.findOne(tripQuery(id)).lean<{
    _id: mongoose.Types.ObjectId;
    title: string;
    area?: string;
    startDate?: Date;
    endDate?: Date;
    etaShare?: IEtaShare;
  } | null>();
  if (!doc) return null;
  return {
    _id: doc._id.toString(),
    title: doc.title,
    area: doc.area ?? "",
    startDate: doc.startDate?.toISOString(),
    endDate: doc.endDate?.toISOString(),
    defaultExpectedReturnAt: defaultExpectedReturn(doc.startDate, doc.endDate),
    etaShare: doc.etaShare
      ? {
          token: doc.etaShare.token,
          enabled: doc.etaShare.enabled,
          contactName: doc.etaShare.contactName,
          contactPhone: doc.etaShare.contactPhone,
          expectedReturnAt: new Date(
            doc.etaShare.expectedReturnAt,
          ).toISOString(),
          createdAt: new Date(doc.etaShare.createdAt).toISOString(),
          completedAt: doc.etaShare.completedAt
            ? new Date(doc.etaShare.completedAt).toISOString()
            : null,
          path: `/eta/${doc.etaShare.token}`,
        }
      : null,
  };
}

export default async function EtaSharePage({ params }: PageProps) {
  const { id } = await params;
  const view = await loadView(id);
  if (!view) notFound();

  return (
    <main className="bg-bg min-h-screen">
      <div className="mx-auto flex max-w-3xl flex-col gap-lg px-md py-lg sm:px-lg sm:py-xl">
        <header className="flex flex-col gap-sm">
          <Link
            href={`/tur/${view._id}`}
            className="text-small font-bold text-flame-pressed underline underline-offset-4"
          >
            ← Tilbake til turen
          </Link>
          <p
            className="text-xs font-bold uppercase tracking-label text-flame-pressed"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            ETA-deling for soloturer
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-text-primary leading-tight">
            Del forventet hjemkomst
          </h1>
          <p className="text-sm text-text-muted">
            {view.title}
            {view.area ? ` · ${view.area}` : ""}
          </p>
          <p
            className="text-base text-text-primary"
            style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
          >
            &ldquo;{randomQuip("etaShare")}&rdquo; - Lars
          </p>
        </header>

        <section className="bg-bg border-4 border-flame-pressed rounded-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] p-lg">
          <h2 className="font-heading font-bold text-h2 text-forest mb-md">
            Kontaktperson og ETA
          </h2>
          <EtaSharePanel
            tripId={view._id}
            tripTitle={view.title}
            defaultExpectedReturnAt={view.defaultExpectedReturnAt}
            initialEtaShare={view.etaShare}
          />
        </section>

        <section className="bg-bg-secondary border-2 border-border rounded-lg p-lg">
          <h2 className="font-heading font-bold text-h3 text-text-primary mb-sm">
            Slik fungerer det
          </h2>
          <ol className="list-decimal pl-md flex flex-col gap-xs text-sm text-text-primary">
            <li>
              Velg en kontaktperson hjemme og forventet hjemkomst-tid (vi
              foreslår turens slutt kl 18).
            </li>
            <li>
              Lag en delelink. Send via SMS, Web Share eller kopier lenken og
              lim inn i ditt favoritt-meldingsapp.
            </li>
            <li>
              Kontakten åpner lenken og ser status: planlagt, på tur, forsinket
              eller hjemme.
            </li>
            <li>
              Hvis du er mer enn 60 minutter forsinket etter ETA, viser siden
              forsinket-status med &ldquo;Ring 113&rdquo;-knapp.
            </li>
            <li>
              Når du er trygt hjemme, marker som hjemme. Da slutter siden å
              eskalere.
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
