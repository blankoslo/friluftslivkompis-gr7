import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  Trip,
  type IEmergencyContact,
  type ITripCabin,
} from "@/models/Trip";
import { getCabin, type Cabin } from "@/lib/ut";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface CabinView {
  utId?: number;
  name: string;
  lat: number;
  lon: number;
  phone?: string | null;
  serviceLevel?: string | null;
  staffed: boolean;
  distanceFromStartKm?: number;
}

interface View {
  _id: string;
  title: string;
  area: string;
  startDate?: string;
  endDate?: string;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    role: IEmergencyContact["role"];
    note?: string;
  }>;
  cabins: CabinView[];
  staffedNearby: CabinView[];
}

export const dynamic = "force-dynamic";

function tripQuery(id: string) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
}

function isStaffed(c: Pick<Cabin, "serviceLevel">) {
  const lvl = (c.serviceLevel ?? "").toUpperCase();
  return lvl === "STAFFED" || lvl === "BETJENT";
}

async function loadView(id: string): Promise<View | null> {
  await connectToDatabase();
  const doc = await Trip.findOne(tripQuery(id)).lean<{
    _id: mongoose.Types.ObjectId;
    title: string;
    area?: string;
    startDate?: Date;
    endDate?: Date;
    cabins?: ITripCabin[];
    emergencyContacts?: (IEmergencyContact & {
      _id?: mongoose.Types.ObjectId;
    })[];
  } | null>();
  if (!doc) return null;

  const cabins = doc.cabins ?? [];
  const enriched = await Promise.all(
    cabins.map(async (c): Promise<CabinView> => {
      let phone: string | null = null;
      let serviceLevel: string | null = null;
      if (c.utId) {
        try {
          const data = await getCabin(c.utId, { revalidate: 86400 });
          phone = data?.phone ?? null;
          serviceLevel = data?.serviceLevel ?? null;
        } catch {
          phone = null;
        }
      }
      return {
        utId: c.utId,
        name: c.name,
        lat: c.lat,
        lon: c.lon,
        phone,
        serviceLevel,
        staffed: isStaffed({ serviceLevel }),
      };
    }),
  );

  const staffedNearby = enriched.filter((c) => c.staffed);

  return {
    _id: doc._id.toString(),
    title: doc.title,
    area: doc.area ?? "",
    startDate: doc.startDate?.toISOString(),
    endDate: doc.endDate?.toISOString(),
    emergencyContacts: (doc.emergencyContacts ?? []).map((c) => ({
      name: c.name,
      phone: c.phone,
      role: c.role,
      note: c.note,
    })),
    cabins: enriched,
    staffedNearby,
  };
}

const ROLE_LABEL: Record<IEmergencyContact["role"], string> = {
  turleder: "Turleder",
  pårørende: "Pårørende",
  fastlege: "Fastlege",
  forsikring: "Forsikring",
  annet: "Annet",
};

const ROLE_TONE: Record<IEmergencyContact["role"], string> = {
  turleder: "bg-flame-tint text-flame",
  pårørende: "bg-forest-tint text-forest",
  fastlege: "bg-fjord-tint text-fjord",
  forsikring: "bg-bg-secondary text-text-muted",
  annet: "bg-bg-secondary text-text-muted",
};

export default async function EmergencyInfoPage({ params }: PageProps) {
  const { id } = await params;
  const view = await loadView(id);
  if (!view) notFound();

  return (
    <main className="bg-bg min-h-screen">
      <div className="mx-auto max-w-3xl px-md py-lg sm:px-lg sm:py-xl flex flex-col gap-lg">
        <header className="bg-warning-bg border-4 border-warning rounded-lg shadow-[6px_6px_0_var(--accent-warning)] p-lg flex flex-col gap-sm">
          <Link
            href={`/tur/${view._id}`}
            className="text-small font-bold text-warning underline underline-offset-4"
          >
            ← Tilbake til turen
          </Link>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-warning leading-tight">
            Nødinfo
          </h1>
          <p className="text-sm text-text-primary">
            {view.title}
            {view.area ? ` · ${view.area}` : ""}
          </p>
          <p className="text-xs text-text-muted">
            Denne siden er lagret offline når turen er lastet ned. Trykk på et
            nummer for å ringe.
          </p>
        </header>

        <Section label="Akutte nødnummer" tone="warning">
          <div className="grid gap-sm sm:grid-cols-2">
            <CallCard
              label="Politi / redning"
              number="113"
              hint="Akutt fare eller skade. Norge."
              tone="warning"
            />
            <CallCard
              label="Brann"
              number="110"
              hint="Brann, ulykke, farlig stoff."
              tone="warning"
            />
            <CallCard
              label="Politi (ikke akutt)"
              number="112"
              hint="Politi i Norge, ikke akutt."
              tone="fjord"
            />
            <CallCard
              label="Legevakt"
              number="116117"
              hint="Nasjonal legevakt. Kobler til nærmeste."
              tone="forest"
            />
          </div>
          <p className="mt-md text-xs text-text-muted">
            Ingen dekning? Send SMS til 113. SOS-melding via satellitt fungerer
            på de fleste nyere telefoner.
          </p>
        </Section>

        <Section label="Bemannede hytter på ruta">
          {view.staffedNearby.length === 0 ? (
            <p className="text-sm text-text-muted">
              Ingen betjente hytter funnet på ruta. Se alle hytter under for
              nærmeste tak over hodet.
            </p>
          ) : (
            <ul className="flex flex-col gap-sm">
              {view.staffedNearby.map((c) => (
                <CabinRow key={c.name + c.lat} cabin={c} />
              ))}
            </ul>
          )}
        </Section>

        <Section label="Alle hytter på turen">
          {view.cabins.length === 0 ? (
            <p className="text-sm text-text-muted">
              Ingen hytter lagt inn ennå.
            </p>
          ) : (
            <ul className="flex flex-col gap-sm">
              {view.cabins.map((c) => (
                <CabinRow key={c.name + c.lat} cabin={c} />
              ))}
            </ul>
          )}
        </Section>

        <Section label="Gruppas nødkontakter">
          {view.emergencyContacts.length === 0 ? (
            <p className="text-sm text-text-muted">
              Ingen kontakter lagt til ennå. Turplanleggeren kan legge til
              turleder, pårørende og forsikring fra hovedsiden for turen.
            </p>
          ) : (
            <ul className="flex flex-col gap-sm">
              {view.emergencyContacts.map((c, idx) => (
                <li
                  key={idx}
                  className="flex flex-wrap items-center gap-sm rounded-md border border-border bg-bg p-sm"
                >
                  <span
                    className={`rounded-pill px-xs py-[2px] text-[10px] font-bold uppercase tracking-label ${ROLE_TONE[c.role]}`}
                  >
                    {ROLE_LABEL[c.role]}
                  </span>
                  <span className="font-heading text-sm font-bold text-text-primary">
                    {c.name}
                  </span>
                  <a
                    href={`tel:${c.phone}`}
                    className="font-mono text-base font-bold text-fjord underline underline-offset-2"
                  >
                    {c.phone}
                  </a>
                  {c.note && (
                    <span className="flex-1 min-w-[160px] text-xs text-text-muted">
                      {c.note}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <p className="text-xs text-text-muted">
          Lars sier: Best at du leser dette nå, ikke når det stormer.
        </p>
      </div>
    </main>
  );
}

function Section({
  label,
  tone = "default",
  children,
}: {
  label: string;
  tone?: "default" | "warning";
  children: React.ReactNode;
}) {
  const border =
    tone === "warning"
      ? "border-warning shadow-[6px_6px_0_var(--accent-warning)]"
      : "border-flame-pressed shadow-[6px_6px_0_var(--brand-flame-pressed)]";
  return (
    <section className={`bg-bg border-4 rounded-lg p-lg ${border}`}>
      <h2 className="font-heading font-bold text-h2 text-forest mb-md">
        {label}
      </h2>
      <div className="text-text-primary text-body">{children}</div>
    </section>
  );
}

function CallCard({
  label,
  number,
  hint,
  tone,
}: {
  label: string;
  number: string;
  hint: string;
  tone: "warning" | "forest" | "fjord";
}) {
  const accent =
    tone === "warning"
      ? "border-warning bg-warning-bg text-warning"
      : tone === "forest"
        ? "border-forest bg-forest-tint text-forest"
        : "border-fjord bg-fjord-tint text-fjord";
  return (
    <a
      href={`tel:${number}`}
      className={`flex flex-col gap-xs rounded-lg border-2 p-md font-bold ${accent} hover:opacity-90`}
    >
      <span className="text-xs uppercase tracking-label">{label}</span>
      <span className="font-heading text-3xl font-black">{number}</span>
      <span className="text-xs font-normal opacity-80">{hint}</span>
    </a>
  );
}

function CabinRow({ cabin }: { cabin: CabinView }) {
  return (
    <li className="flex flex-wrap items-center gap-sm rounded-md border border-border bg-bg p-sm">
      {cabin.staffed && (
        <span className="rounded-pill px-xs py-[2px] text-[10px] font-bold uppercase tracking-label bg-forest-tint text-forest">
          Betjent
        </span>
      )}
      <span className="font-heading text-sm font-bold text-text-primary">
        {cabin.name}
      </span>
      {cabin.phone ? (
        <a
          href={`tel:${cabin.phone.replace(/\s+/g, "")}`}
          className="font-mono text-sm font-bold text-fjord underline underline-offset-2"
        >
          {cabin.phone}
        </a>
      ) : (
        <span className="text-xs text-text-muted">Ingen tlf. registrert</span>
      )}
      <span className="font-mono text-[11px] text-text-muted">
        {cabin.lat.toFixed(4)}, {cabin.lon.toFixed(4)}
      </span>
    </li>
  );
}
