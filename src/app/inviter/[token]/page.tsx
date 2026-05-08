import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  Trip,
  type IParticipant,
  type ITripCabin,
} from "@/models/Trip";
import { AcceptForm } from "./accept-form";
import {
  ParticipantsLive,
  type LiveParticipant,
} from "@/components/trips/participants-live";
import { buildTimeline } from "@/lib/timeline";
import { TripTimelineView } from "@/components/timeline/timeline";
import { haversineKm, type CabinPoint } from "@/lib/route";
import { randomQuip } from "@/lib/lars-monsen/quips";
import { InviteMapLoader } from "./invite-map-loader";
import { ShareButton } from "./share-button";
import { ReviewsSection } from "@/components/social/reviews-section";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: InvitePageProps): Promise<Metadata> {
  const { token } = await params;
  const trip = await loadByToken(token);
  if (!trip) return { title: "Tur ikke funnet" };
  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const description =
    [trip.area, dateRange, `${trip.cabins.length} hytter`]
      .filter(Boolean)
      .join(" · ") || "Du er invitert på fjelltur.";
  const url = absoluteUrl(`/inviter/${token}`);
  const ogImage = absoluteUrl(`/api/og/trip/${token}`);
  return {
    metadataBase: new URL(getSiteUrl()),
    title: `${trip.title} - Du er invitert`,
    description,
    openGraph: {
      type: "article",
      url,
      siteName: "På tur med Monsen",
      title: trip.title,
      description,
      locale: "nb_NO",
      images: [{ url: ogImage, width: 1200, height: 630, alt: trip.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: trip.title,
      description,
      images: [ogImage],
    },
  };
}

interface InviteView {
  _id: string;
  title: string;
  area: string;
  inviteToken: string;
  startDate?: string;
  endDate?: string;
  participants: LiveParticipant[];
  cabins: CabinPoint[];
}

async function loadByToken(token: string): Promise<InviteView | null> {
  await connectToDatabase();
  const doc = await Trip.findOne({ inviteToken: token }).lean<{
    _id: { toString(): string };
    title: string;
    area: string;
    inviteToken: string;
    startDate?: Date;
    endDate?: Date;
    participants: IParticipant[];
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
    cabins: (doc.cabins ?? []).map((c) => ({
      utId: c.utId,
      name: c.name,
      lat: c.lat,
      lon: c.lon,
    })),
  };
}

async function TimelineSection({
  cabins,
  startDate,
}: {
  cabins: CabinPoint[];
  startDate: string | null;
}) {
  const timeline = await buildTimeline(cabins, startDate);
  return <TripTimelineView timeline={timeline} />;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const trip = await loadByToken(token);
  if (!trip) notFound();

  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const acceptedCount = trip.participants.filter(
    (p) => p.status === "accepted",
  ).length;
  const declinedCount = trip.participants.filter(
    (p) => p.status === "declined",
  ).length;
  const invitedCount = trip.participants.length - declinedCount;
  const startISO = trip.startDate?.slice(0, 10) ?? null;
  const stats = computeHeroStats(trip);

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
        <div className="flex items-start justify-between gap-md mb-xs">
          <p
            className="text-small font-bold uppercase tracking-label opacity-90"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            Du er invitert
          </p>
          <ShareButton token={trip.inviteToken} title={trip.title} />
        </div>
        <h1
          className="font-heading font-bold leading-[0.95] mb-md"
          style={{ fontSize: "clamp(40px, 9vw, 64px)" }}
        >
          {trip.title}
        </h1>
        <p
          className="text-2xl mb-md opacity-95"
          style={{
            fontFamily: "var(--font-handwriting)",
            fontWeight: 700,
            transform: "rotate(-1deg)",
          }}
        >
          Bli med på tur, da!
        </p>

        {stats.chips.length > 0 && (
          <ul className="flex flex-wrap gap-xs mb-md" aria-label="Turfakta">
            {stats.chips.map((chip) => (
              <li
                key={chip.label}
                className="inline-flex items-baseline gap-1 rounded-pill border-2 border-white/70 bg-white/10 px-md py-xs text-small font-bold text-white backdrop-blur"
                style={{ fontFamily: "var(--font-stamp)", letterSpacing: "0.04em" }}
              >
                <span className="text-base">{chip.value}</span>
                <span className="opacity-80 uppercase">{chip.label}</span>
              </li>
            ))}
          </ul>
        )}

        <p
          className="text-base mb-lg opacity-90"
          style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
        >
          &ldquo;{randomQuip("inviteHero")}&rdquo; - Lars
        </p>

        <section className="bg-bg border-4 border-flame-pressed rounded-lg p-lg mb-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] text-text-primary">
          <h2 className="font-heading font-bold text-h3 text-flame-pressed mb-md">
            Si fra
          </h2>
          <AcceptForm token={trip.inviteToken} />
        </section>

        <section className="bg-bg border-4 border-flame-pressed rounded-lg p-lg mb-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] text-text-primary">
          <h2 className="font-heading font-bold text-h3 text-flame-pressed mb-md">
            Turdetaljer
          </h2>
          <dl className="space-y-sm text-body">
            {trip.area ? (
              <div className="flex justify-between gap-md">
                <dt className="text-text-muted font-semibold">Område</dt>
                <dd className="text-text-primary text-right">{trip.area}</dd>
              </div>
            ) : null}
            {dateRange ? (
              <div className="flex justify-between gap-md">
                <dt className="text-text-muted font-semibold">Dato</dt>
                <dd className="text-text-primary text-right">{dateRange}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-md">
              <dt className="text-text-muted font-semibold">Påmeldte</dt>
              <dd className="text-text-primary text-right">
                {acceptedCount === 0 && invitedCount === 0
                  ? "Ingen enda"
                  : `${acceptedCount} av ${Math.max(invitedCount, acceptedCount)} har sagt ja`}
                {declinedCount > 0 ? (
                  <span className="block text-small text-text-muted font-normal">
                    {declinedCount} kan ikke
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
        </section>

        {trip.cabins.length > 0 && (
          <section className="bg-bg border-4 border-flame-pressed rounded-lg p-lg mb-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] text-text-primary">
            <h2 className="font-heading font-bold text-h3 text-flame-pressed mb-md">
              Kart
            </h2>
            <InviteMapLoader cabins={trip.cabins} />
          </section>
        )}

        <section className="bg-bg border-4 border-flame-pressed rounded-lg p-lg mb-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] text-text-primary">
          <h2 className="font-heading font-bold text-h3 text-flame-pressed mb-md">
            Vær og etapper
          </h2>
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
                  Henter værvarsel fra Yr...
                </p>
              }
            >
              <TimelineSection cabins={trip.cabins} startDate={startISO} />
            </Suspense>
          )}
        </section>

        <section className="bg-bg border-4 border-flame-pressed rounded-lg p-lg mb-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] text-text-primary">
          <h2 className="font-heading font-bold text-h3 text-flame-pressed mb-md">
            Deltakere
          </h2>
          <ParticipantsLive
            tripIdOrToken={trip.inviteToken}
            initialParticipants={trip.participants}
            variant="inviter"
          />
        </section>

        <section className="bg-bg border-4 border-flame-pressed rounded-lg p-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] text-text-primary">
          <h2 className="font-heading font-bold text-h3 text-flame-pressed mb-md">
            Anmeldelser fra turfolket
          </h2>
          <ReviewsSection
            tripId={trip._id}
            targetTitle={trip.title}
            targetArea={trip.area}
          />
        </section>
      </div>
    </main>
  );
}


type HeroChip = { label: string; value: string };

function computeHeroStats(trip: InviteView): { chips: HeroChip[] } {
  const chips: HeroChip[] = [];
  const days = computeDays(trip.startDate, trip.endDate, trip.cabins.length);
  if (days > 0) {
    chips.push({ label: days === 1 ? "dag" : "dager", value: String(days) });
  }
  if (trip.cabins.length > 0) {
    chips.push({
      label: trip.cabins.length === 1 ? "hytte" : "hytter",
      value: String(trip.cabins.length),
    });
  }
  const km = totalKm(trip.cabins);
  if (km > 0) {
    chips.push({ label: "km", value: km.toFixed(km < 10 ? 1 : 0) });
  }
  return { chips };
}

function computeDays(start?: string, end?: string, cabinCount = 0): number {
  if (start && end) {
    const a = new Date(start).getTime();
    const b = new Date(end).getTime();
    if (Number.isFinite(a) && Number.isFinite(b) && b >= a) {
      return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
    }
  }
  if (cabinCount >= 2) return cabinCount - 1;
  return 0;
}

function totalKm(cabins: CabinPoint[]): number {
  if (cabins.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < cabins.length - 1; i++) {
    sum += haversineKm(cabins[i], cabins[i + 1]);
  }
  return Math.round(sum * 10) / 10;
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
