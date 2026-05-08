import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip, type IParticipant } from "@/models/Trip";
import { AcceptForm } from "./accept-form";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

interface InviteView {
  title: string;
  area: string;
  inviteToken: string;
  startDate?: string;
  endDate?: string;
  participants: Array<{ name: string; status: IParticipant["status"] }>;
}

async function loadByToken(token: string): Promise<InviteView | null> {
  await connectToDatabase();
  const doc = await Trip.findOne({ inviteToken: token }).lean<{
    title: string;
    area: string;
    inviteToken: string;
    startDate?: Date;
    endDate?: Date;
    participants: IParticipant[];
  } | null>();
  if (!doc) return null;
  return {
    title: doc.title,
    area: doc.area ?? "",
    inviteToken: doc.inviteToken,
    startDate: doc.startDate?.toISOString(),
    endDate: doc.endDate?.toISOString(),
    participants: (doc.participants ?? []).map((p) => ({
      name: p.name,
      status: p.status,
    })),
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const trip = await loadByToken(token);
  if (!trip) notFound();

  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const accepted = trip.participants.filter((p) => p.status === "accepted");

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
          Du er invitert
        </p>
        <h1
          className="font-heading font-bold leading-[0.95] mb-md"
          style={{ fontSize: "clamp(40px, 9vw, 64px)" }}
        >
          {trip.title}
        </h1>
        <p
          className="text-2xl mb-lg opacity-95"
          style={{
            fontFamily: "var(--font-handwriting)",
            fontWeight: 700,
            transform: "rotate(-1deg)",
          }}
        >
          Bli med på tur, da!
        </p>

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
                {accepted.length} av {Math.max(trip.participants.length, 1)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="bg-bg border-4 border-flame-pressed rounded-lg p-lg mb-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] text-text-primary">
          <h2 className="font-heading font-bold text-h3 text-flame-pressed mb-md">
            Si fra
          </h2>
          <AcceptForm token={trip.inviteToken} />
        </section>

        <section className="bg-bg border-4 border-flame-pressed rounded-lg p-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] text-text-primary">
          <h2 className="font-heading font-bold text-h3 text-flame-pressed mb-md">
            Deltakere ({accepted.length})
          </h2>
          {trip.participants.length === 0 ? (
            <p
              className="text-text-muted text-xl"
              style={{ fontFamily: "var(--font-handwriting)" }}
            >
              Ingen har takka ja enda - bli den fyrste!
            </p>
          ) : (
            <ul className="space-y-sm">
              {trip.participants.map((p, i) => (
                <li
                  key={`${p.name}-${i}`}
                  className="flex items-center justify-between rounded-md border-2 border-flame-pressed bg-flame-tint px-md py-sm shadow-[2px_2px_0_var(--brand-flame-pressed)]"
                >
                  <span className="text-text-primary font-semibold">
                    {p.name}
                  </span>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: IParticipant["status"] }) {
  const map: Record<
    IParticipant["status"],
    { label: string; className: string }
  > = {
    accepted: {
      label: "Akseptert",
      className: "bg-forest-tint text-forest border-forest",
    },
    invited: {
      label: "Invitert",
      className: "bg-fjord-tint text-fjord border-fjord",
    },
    pending: {
      label: "Venter",
      className: "bg-midnight-sun-tint text-midnight-sun border-midnight-sun",
    },
    declined: {
      label: "Avslått",
      className: "bg-warning-bg text-warning border-warning-border",
    },
  };
  const { label, className } = map[status];
  return (
    <span
      className={`text-small px-sm py-xs rounded-pill tracking-label uppercase border-2 font-bold ${className}`}
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
