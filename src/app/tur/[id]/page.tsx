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
import { CabinRouteEditor } from "@/components/route/cabin-route-editor";
import type { CabinPoint } from "@/lib/route";
import { randomQuip } from "@/lib/lars-monsen/quips";

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
      title: "Demo - Jotunheim-runden",
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
  const accepted = trip.participants.filter((p) => p.status === "accepted").length;

  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-md py-lg sm:px-lg sm:py-xl">
        <header className="bg-flame-pressed text-white rounded-lg border-4 border-flame-pressed shadow-[6px_6px_0_var(--brand-flame-pressed)] mb-xl relative">
          {trip.isDemo && (
            <span
              className="absolute -top-3 right-md bg-midnight-sun text-text-primary text-xs font-bold px-sm py-1 rounded border-2 border-text-primary uppercase tracking-label z-10"
              style={{
                fontFamily: "var(--font-stamp)",
                transform: "rotate(4deg)",
              }}
            >
              DEMO
            </span>
          )}
          <div className="p-lg flex flex-col gap-sm">
            <p
              className="text-sm opacity-90 uppercase tracking-label"
              style={{ fontFamily: "var(--font-stamp)" }}
            >
              {[trip.area, dateRange].filter(Boolean).join(" - ") || "Klar for planlegging"}
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl font-black leading-tight">
              {trip.title}
            </h1>
            {trip.participants.length > 0 && (
              <p className="text-sm opacity-90">
                {accepted} av {trip.participants.length} har sagt ja
              </p>
            )}
          </div>
        </header>

        <div className="grid gap-lg">
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

          <Section label="Hytter og etapper" badge="B3" accent="fjord">
            <CabinRouteEditor
              initialCabins={trip.cabins}
              tripId={trip._id}
              isDemo={trip.isDemo}
            />
          </Section>

          <Section label="Tidslinje og vær" badge="B1 / B6" accent="fjord">
            {trip.cabins.length < 2 ? (
              <p
                className="text-text-primary text-lg leading-snug"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                {randomQuip("timelineEmpty")}
              </p>
            ) : (
              <Suspense
                fallback={
                  <p
                    className="text-text-primary text-lg leading-snug"
                    style={{ fontFamily: "var(--font-handwriting)" }}
                  >
                    Beregner etapper og henter værdata fra Yr...
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
              <p
                className="text-text-primary text-lg leading-snug"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                {randomQuip("expenses")}
              </p>
            </Section>
          )}
        </div>
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
      <p
        className="text-text-primary text-lg leading-snug"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        {randomQuip("noParticipants")} Del invitasjonslenken ovenfor.
      </p>
    );
  }
  return (
    <ul className="grid gap-sm">
      {participants.map((p, i) => (
        <li
          key={`${p.name}-${i}`}
          className="flex items-center justify-between rounded-md border-2 border-flame-pressed bg-bg px-md py-sm shadow-[2px_2px_0_var(--brand-flame-pressed)]"
        >
          <span className="text-text-primary font-semibold">{p.name}</span>
          <StatusBadge status={p.status} />
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: IParticipant["status"] }) {
  const map: Record<IParticipant["status"], { label: string; className: string }> = {
    accepted: {
      label: "Bekreftet",
      className: "bg-forest text-white",
    },
    invited: {
      label: "Invitert",
      className: "bg-fjord text-white",
    },
    pending: {
      label: "Venter",
      className: "bg-midnight-sun text-text-primary",
    },
    declined: {
      label: "Avslått",
      className: "bg-flame-hover text-white",
    },
  };
  const { label, className } = map[status];
  return (
    <span
      className={`text-xs font-bold px-sm py-1 rounded-pill uppercase tracking-label ${className}`}
      style={{ fontFamily: "var(--font-stamp)" }}
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
  return `${fmt(start)} - ${fmt(end)}`;
}

type Accent = "flame" | "forest" | "fjord" | "midnight-sun";

const accentHeading: Record<Accent, string> = {
  flame: "text-flame-primary",
  forest: "text-forest",
  fjord: "text-fjord",
  "midnight-sun": "text-midnight-sun",
};

const accentBadge: Record<Accent, string> = {
  flame: "bg-flame-primary text-white",
  forest: "bg-forest text-white",
  fjord: "bg-fjord text-white",
  "midnight-sun": "bg-midnight-sun text-text-primary",
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
  return (
    <section className="bg-bg border-4 border-flame-pressed rounded-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] p-lg relative">
      <div className="flex items-center gap-sm mb-md flex-wrap">
        <h2 className={`font-heading font-bold text-h2 ${accentHeading[accent]}`}>
          {label}
        </h2>
        <span
          className={`text-xs font-bold px-sm py-1 rounded-pill uppercase tracking-label ${accentBadge[accent]}`}
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          {badge}
        </span>
      </div>
      <div className="text-text-primary text-body">{children}</div>
    </section>
  );
}
