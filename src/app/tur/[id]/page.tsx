import { Suspense } from "react";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  Trip,
  type IParticipant,
  type IPackingItem,
  type ITripCabin,
} from "@/models/Trip";
import { InviteLink } from "./invite-link";
import {
  PackingList,
  type PackingItem,
} from "@/components/packing/packing-list";
import { buildTimeline } from "@/lib/timeline";
import { TripTimelineView } from "@/components/timeline/timeline";
import type { CabinPoint } from "@/lib/route";

const DEMO_CABINS: CabinPoint[] = [
  { name: "Gjendesheim", lat: 61.4945, lon: 8.8108 },
  { name: "Memurubu", lat: 61.535, lon: 8.602 },
  { name: "Glitterheim", lat: 61.6385, lon: 8.5418 },
  { name: "Spiterstulen", lat: 61.6232, lon: 8.4136 },
];

const DEMO_TOKEN = "demo";

function demoStartIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 2);
  return d.toISOString().slice(0, 10);
}

interface TripPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ skipElevation?: string }>;
}

interface TripView {
  _id: string;
  title: string;
  area: string;
  inviteToken: string;
  startDate?: string;
  endDate?: string;
  participants: Array<{
    name: string;
    status: IParticipant["status"];
  }>;
  packingList: PackingItem[];
  cabins: CabinPoint[];
  isDemo: boolean;
}

async function loadTrip(id: string): Promise<TripView | null> {
  if (id === "demo") {
    const start = demoStartIso();
    return {
      _id: "demo",
      title: "Demo · Jotunheim-runden",
      area: "Jotunheimen",
      inviteToken: DEMO_TOKEN,
      startDate: `${start}T00:00:00.000Z`,
      endDate: undefined,
      participants: [],
      packingList: [],
      cabins: DEMO_CABINS,
      isDemo: true,
    };
  }
  await connectToDatabase();
  const query = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
  const doc = await Trip.findOne(query).lean<{
    _id: mongoose.Types.ObjectId;
    title: string;
    area: string;
    inviteToken: string;
    startDate?: Date;
    endDate?: Date;
    participants: IParticipant[];
    packingList?: IPackingItem[];
    cabins?: ITripCabin[];
  } | null>();
  if (!doc) return null;
  return {
    _id: doc._id.toString(),
    title: doc.title,
    area: doc.area ?? "",
    inviteToken: doc.inviteToken,
    startDate: doc.startDate?.toISOString(),
    endDate: doc.endDate?.toISOString(),
    participants: (doc.participants ?? []).map((p) => ({
      name: p.name,
      status: p.status,
    })),
    packingList: (doc.packingList ?? []).map((item) => ({
      name: item.name,
      packed: item.packed ?? false,
      isAiSuggested: item.isAiSuggested ?? false,
    })),
    cabins: (doc.cabins ?? []).map((c) => ({
      utId: c.utId,
      name: c.name,
      lat: c.lat,
      lon: c.lon,
    })),
    isDemo: false,
  };
}

async function TimelineSection({
  cabins,
  startDate,
  skipElevation,
}: {
  cabins: CabinPoint[];
  startDate: string | null;
  skipElevation: boolean;
}) {
  const timeline = await buildTimeline(cabins, startDate, { skipElevation });
  return <TripTimelineView timeline={timeline} />;
}

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const { id } = await params;
  const { skipElevation: skipElevQs } = await searchParams;
  const skipElevation = skipElevQs === "1" || skipElevQs === "true";

  const trip = await loadTrip(id);
  if (!trip) notFound();

  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const startISO = trip.startDate?.slice(0, 10) ?? null;

  return (
    <main className="p-xl max-w-4xl mx-auto">
      <header className="mb-xl">
        <h1 className="font-heading text-h1 font-bold text-text-primary mb-xs">
          {trip.title}
        </h1>
        <p className="text-text-muted text-body">
          {[trip.area, dateRange].filter(Boolean).join(" · ") || "Klar for planlegging"}
        </p>
      </header>

      <div className="grid gap-md">
        {!trip.isDemo && (
          <Section label="Inviter deltakere" badge="G1" accent="forest">
            <InviteLink token={trip.inviteToken} />
          </Section>
        )}

        {!trip.isDemo && (
          <Section label="Deltakere" badge="G1, G4" accent="forest">
            <ParticipantList participants={trip.participants} />
          </Section>
        )}

        <Section label="Tidslinje · vær · rute" badge="B1 · B3 · B6" accent="fjord">
          {trip.cabins.length < 2 ? (
            <p className="text-text-muted">
              Legg til minst to hytter for å se etapper, høydemeter og værvarsel.
            </p>
          ) : (
            <Suspense
              fallback={
                <p className="text-text-muted">
                  Beregner etapper og henter værdata fra Yr…
                </p>
              }
            >
              <TimelineSection
                cabins={trip.cabins}
                startDate={startISO}
                skipElevation={skipElevation}
              />
            </Suspense>
          )}
        </Section>

        {!trip.isDemo && (
          <Section label="Pakkeliste" badge="P1" accent="midnight-sun">
            <PackingList tripId={trip._id} initialItems={trip.packingList} />
          </Section>
        )}
        {!trip.isDemo && (
          <Section label="Utgifter" badge="R1" accent="flame">
            Kostnadsregistrering og splitt kommer her
          </Section>
        )}
      </div>
    </main>
  );
}

function ParticipantList({
  participants,
}: {
  participants: TripView["participants"];
}) {
  if (participants.length === 0) {
    return (
      <p className="text-text-muted">
        Ingen deltakere ennå. Del invitasjonslenken ovenfor.
      </p>
    );
  }
  return (
    <ul className="space-y-sm">
      {participants.map((p, i) => (
        <li
          key={`${p.name}-${i}`}
          className="flex items-center justify-between rounded-md border border-border bg-bg px-md py-sm"
        >
          <span className="text-text-primary">{p.name}</span>
          <StatusBadge status={p.status} />
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: IParticipant["status"] }) {
  const map: Record<IParticipant["status"], { label: string; className: string }> = {
    accepted: {
      label: "Akseptert",
      className: "bg-forest-tint text-forest",
    },
    invited: {
      label: "Invitert",
      className: "bg-fjord-tint text-fjord",
    },
    pending: {
      label: "Venter",
      className: "bg-midnight-sun-tint text-midnight-sun",
    },
    declined: {
      label: "Avslått",
      className: "bg-warning-bg text-warning",
    },
  };
  const { label, className } = map[status];
  return (
    <span
      className={`text-small font-mono px-sm py-xs rounded-pill tracking-label ${className}`}
    >
      {label}
    </span>
  );
}

function formatDateRange(start?: string, end?: string) {
  if (!start) return "";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (!end || end === start) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
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
    <section className={`rounded-md border ${styles.border} bg-surface p-lg`}>
      <div className="flex items-center gap-sm mb-md">
        <h2 className={`font-heading font-semibold text-h3 ${styles.heading}`}>
          {label}
        </h2>
        <span
          className={`text-small font-mono px-sm py-xs rounded ${styles.badge}`}
        >
          {badge}
        </span>
      </div>
      <div className="text-text-primary text-body">{children}</div>
    </section>
  );
}
