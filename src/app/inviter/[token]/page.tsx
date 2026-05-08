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
    <main className="p-xl max-w-2xl mx-auto">
      <p className="text-small text-text-muted tracking-label uppercase mb-xs">
        Du er invitert
      </p>
      <h1 className="font-heading text-h1 font-bold text-text-primary mb-xs">
        {trip.title}
      </h1>
      <p className="text-text-muted text-body mb-xl">
        {[trip.area, dateRange].filter(Boolean).join(" · ") || "Detaljer kommer"}
      </p>

      <section className="rounded-md border border-forest/30 bg-surface p-lg mb-md">
        <h2 className="font-heading font-semibold text-h3 text-forest mb-md">
          Bli med
        </h2>
        <AcceptForm token={trip.inviteToken} />
      </section>

      <section className="rounded-md border border-border bg-surface p-lg">
        <h2 className="font-heading font-semibold text-h3 text-text-primary mb-md">
          Deltakere ({accepted.length})
        </h2>
        {trip.participants.length === 0 ? (
          <p className="text-text-muted">
            Ingen har takket ja ennå. Du kan bli den første.
          </p>
        ) : (
          <ul className="space-y-sm">
            {trip.participants.map((p, i) => (
              <li
                key={`${p.name}-${i}`}
                className="flex items-center justify-between rounded-md border border-border bg-bg px-md py-sm"
              >
                <span className="text-text-primary">{p.name}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: IParticipant["status"] }) {
  const map: Record<IParticipant["status"], { label: string; className: string }> = {
    accepted: { label: "Akseptert", className: "bg-forest-tint text-forest" },
    invited: { label: "Invitert", className: "bg-fjord-tint text-fjord" },
    pending: { label: "Venter", className: "bg-midnight-sun-tint text-midnight-sun" },
    declined: { label: "Avslått", className: "bg-warning-bg text-warning" },
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
