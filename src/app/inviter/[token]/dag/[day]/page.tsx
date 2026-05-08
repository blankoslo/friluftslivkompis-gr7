import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type IParticipant, type ITripCabin } from "@/models/Trip";
import { buildTimeline } from "@/lib/timeline";
import { TimelineDayCard } from "@/components/timeline/timeline";
import { DayAcceptForm } from "./day-accept-form";
import type { CabinPoint } from "@/lib/route";

interface DayInvitePageProps {
  params: Promise<{ token: string; day: string }>;
}

interface TripDayView {
  title: string;
  inviteToken: string;
  startDate: string | null;
  cabins: CabinPoint[];
}

async function loadByToken(token: string): Promise<TripDayView | null> {
  await connectToDatabase();
  const doc = await Trip.findOne({ inviteToken: token }).lean<{
    title: string;
    inviteToken: string;
    startDate?: Date;
    participants: IParticipant[];
    cabins?: ITripCabin[];
  } | null>();
  if (!doc) return null;
  return {
    title: doc.title,
    inviteToken: doc.inviteToken,
    startDate: doc.startDate?.toISOString().slice(0, 10) ?? null,
    cabins: (doc.cabins ?? []).map((c) => ({
      utId: c.utId,
      name: c.name,
      lat: c.lat,
      lon: c.lon,
    })),
  };
}

export default async function DayInvitePage({ params }: DayInvitePageProps) {
  const { token, day: dayParam } = await params;
  const dayNumber = parseInt(dayParam, 10);
  if (isNaN(dayNumber) || dayNumber < 1) notFound();

  const trip = await loadByToken(token);
  if (!trip) notFound();

  if (trip.cabins.length < 2) notFound();

  const timeline = await buildTimeline(trip.cabins, trip.startDate);
  const dayData = timeline.days.find((d) => d.dayNumber === dayNumber);
  if (!dayData) notFound();

  const { leg } = dayData;
  const legLabel = `${leg.from.name} → ${leg.to.name}`;

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
        <p
          className="text-small font-bold uppercase tracking-label opacity-90 mb-xs"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          Dag-invitasjon · {trip.title}
        </p>
        <h1
          className="font-heading font-bold leading-[0.95] mb-sm"
          style={{ fontSize: "clamp(36px, 8vw, 56px)" }}
        >
          Dag {dayNumber}
        </h1>
        <p
          className="text-2xl mb-lg opacity-95"
          style={{
            fontFamily: "var(--font-handwriting)",
            fontWeight: 700,
            transform: "rotate(-1deg)",
          }}
        >
          {legLabel}
        </p>

        <section className="mb-lg">
          <TimelineDayCard day={dayData} />
        </section>

        <section className="bg-bg border-4 border-flame-pressed rounded-lg p-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] text-text-primary">
          <h2 className="font-heading font-bold text-h3 text-flame-pressed mb-md">
            Er du med?
          </h2>
          <DayAcceptForm
            token={trip.inviteToken}
            dayNumber={dayNumber}
            legLabel={legLabel}
          />
        </section>
      </div>
    </main>
  );
}
