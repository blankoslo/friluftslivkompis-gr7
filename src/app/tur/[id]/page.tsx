import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  Trip,
  type IConsumable,
  type IEmergencyContact,
  type IExpense,
  type IMealDay,
  type IParticipant,
  type IPackingItem,
  type IReminder,
  type IShoppingItem,
  type ITripCabin,
} from "@/models/Trip";
import { InviteLink } from "./invite-link";
import {
  PackingList,
  type PackingItem,
  type PackingListParticipant,
} from "@/components/packing/packing-list";
import { WeightSummary } from "@/components/packing/weight-summary";
import {
  MealPlanPanel,
  type ConsumableItem,
  type MealPlanDay,
  type ShoppingListItem,
} from "@/components/meal-plan/meal-plan-panel";
import {
  RemindersPanel,
  type Reminder,
} from "@/components/reminders/reminders-panel";
import { RouteMapAndTimeline } from "@/components/route/route-map-and-timeline";
import { CabinRouteEditor } from "@/components/route/cabin-route-editor";
import { CabinAvailability } from "@/components/route/cabin-availability";
import { CabinComparePanel } from "@/components/cabins/cabin-compare-panel";
import { GpxExportButton } from "@/components/route/gpx-export-button";
import { NowcastCard } from "@/components/weather/nowcast-card";
import type { CabinPoint } from "@/lib/route";
import { randomQuip } from "@/lib/lars-monsen/quips";
import { MonsenSessionToast } from "@/components/lars-monsen/monsen-session-toast";
import { ParticipantsLive } from "@/components/trips/participants-live";
import { DayInviteLinks } from "@/components/trips/day-invite-links";
import {
  ExpensesPanel,
  type ExpensesPanelExpense,
  type ExpensesPanelParticipant,
} from "@/components/expenses/expenses-panel";
import {
  EmergencyContactsPanel,
  type EmergencyContact,
} from "@/components/emergency/emergency-contacts-panel";
import {
  TripSideNav,
  type TripSideNavItem,
} from "@/components/trips/trip-side-nav";
import { DuplicateTripButton } from "@/components/trips/duplicate-trip-button";
import { ElevationProfile } from "@/components/trips/elevation-profile";
import {
  computeProfilePoints,
  computeTripStats,
  type ProfilePoint,
  type TripStats,
} from "@/lib/trips/stats";
import type { ILeg } from "@/models/Trip";

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
  searchParams: Promise<{ skipElevation?: string; as?: string }>;
}

interface TripView {
  _id: string;
  title: string;
  area: string;
  inviteToken: string;
  startDate?: string;
  endDate?: string;
  participants: Array<{
    id: string;
    name: string;
    status: IParticipant["status"];
    days?: number[];
  }>;
  packingList: PackingItem[];
  cabins: CabinPoint[];
  expenses: ExpensesPanelExpense[];
  mealPlan: MealPlanDay[];
  shoppingList: ShoppingListItem[];
  consumables: ConsumableItem[];
  reminders: Reminder[];
  emergencyContacts: EmergencyContact[];
  totalDays: number | null;
  isDemo: boolean;
  isPast: boolean;
  stats: TripStats;
  profile: ProfilePoint[];
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
      expenses: [],
      mealPlan: [],
      shoppingList: [],
      consumables: [],
      reminders: [],
      emergencyContacts: [],
      totalDays: DEMO_CABINS.length - 1,
      isDemo: true,
      isPast: false,
      stats: {
        distanceKm: 0,
        elevationGain: 0,
        totalHours: 0,
        legCount: 0,
        durationDays: DEMO_CABINS.length - 1,
        cabinCount: DEMO_CABINS.length,
        source: "empty",
      },
      profile: [],
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
    participants: (IParticipant & { _id: mongoose.Types.ObjectId })[];
    packingList?: (IPackingItem & { _id?: mongoose.Types.ObjectId })[];
    cabins?: ITripCabin[];
    expenses?: IExpense[];
    mealPlan?: IMealDay[];
    shoppingList?: (IShoppingItem & { _id?: mongoose.Types.ObjectId })[];
    consumables?: (IConsumable & { _id?: mongoose.Types.ObjectId })[];
    reminders?: (IReminder & { _id?: mongoose.Types.ObjectId })[];
    emergencyContacts?: (IEmergencyContact & {
      _id?: mongoose.Types.ObjectId;
    })[];
    legs?: ILeg[];
  } | null>();
  if (!doc) return null;
  const cabins = (doc.cabins ?? []).map((c) => ({
    utId: c.utId,
    name: c.name,
    lat: c.lat,
    lon: c.lon,
  }));
  return {
    _id: doc._id.toString(),
    title: doc.title,
    area: doc.area ?? "",
    inviteToken: doc.inviteToken,
    startDate: doc.startDate?.toISOString(),
    endDate: doc.endDate?.toISOString(),
    participants: (doc.participants ?? []).map((p) => ({
      id: p._id.toString(),
      name: p.name,
      status: p.status,
      days: p.days,
    })),
    packingList: (doc.packingList ?? []).map((item) => ({
      _id: item._id?.toString(),
      name: item.name,
      packed: item.packed ?? false,
      isAiSuggested: item.isAiSuggested ?? false,
      quantity: item.quantity ?? 1,
      category: item.category,
      isShared: item.isShared ?? false,
      weightGrams: item.weightGrams,
      reason: item.reason,
      assignedTo: item.assignedTo?.toString(),
    })),
    cabins,
    expenses: (doc.expenses ?? []).map((e) => ({
      id: (e._id ?? "").toString(),
      description: e.description,
      amount: e.amount,
      paidBy: e.paidBy.toString(),
      splitAmong: (e.splitAmong ?? []).map((s) => s.toString()),
      dayNumber: e.dayNumber ?? null,
      createdAt: e.createdAt?.toISOString(),
    })),
    mealPlan: (doc.mealPlan ?? []).map((d) => ({
      dayNumber: d.dayNumber,
      participantsToday: d.participantsToday,
      meals: (d.meals ?? []).map((m) => ({
        type: m.type,
        name: m.name,
        ingredients: (m.ingredients ?? []).map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          category: i.category,
          weightGrams: i.weightGrams,
        })),
      })),
    })),
    shoppingList: (doc.shoppingList ?? []).map((s) => ({
      _id: s._id?.toString(),
      name: s.name,
      quantity: s.quantity,
      unit: s.unit,
      category: s.category,
      bought: s.bought ?? false,
      assignedTo: s.assignedTo?.toString(),
    })),
    consumables: (doc.consumables ?? []).map((c) => ({
      _id: c._id?.toString(),
      name: c.name,
      quantity: c.quantity,
      unit: c.unit,
      reason: c.reason,
      bought: c.bought ?? false,
      assignedTo: c.assignedTo?.toString(),
    })),
    reminders: (doc.reminders ?? []).map((r) => ({
      _id: r._id?.toString(),
      daysBefore: r.daysBefore,
      label: r.label,
      kind: r.kind ?? "annet",
    })),
    emergencyContacts: (doc.emergencyContacts ?? []).map((c) => ({
      _id: c._id?.toString(),
      name: c.name,
      phone: c.phone,
      role: c.role ?? "annet",
      note: c.note,
    })),
    totalDays: computeTotalDays(doc.startDate, doc.endDate, cabins.length),
    isDemo: false,
    isPast: isTripPast(doc.endDate ?? doc.startDate),
    stats: computeTripStats(doc.legs, doc.cabins, doc.startDate, doc.endDate),
    profile: computeProfilePoints(doc.legs, doc.cabins),
  };
}

function isTripPast(date: Date | undefined): boolean {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

function computeTotalDays(
  start: Date | undefined,
  end: Date | undefined,
  cabinCount: number,
): number | null {
  if (start && end) {
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    if (diff > 0) return diff;
  }
  if (cabinCount >= 2) return cabinCount - 1;
  return null;
}

function cabinsBboxParam(cabins: CabinPoint[]): string {
  if (cabins.length === 0) return "";
  let lonMin = Infinity;
  let lonMax = -Infinity;
  let latMin = Infinity;
  let latMax = -Infinity;
  for (const c of cabins) {
    if (c.lon < lonMin) lonMin = c.lon;
    if (c.lon > lonMax) lonMax = c.lon;
    if (c.lat < latMin) latMin = c.lat;
    if (c.lat > latMax) latMax = c.lat;
  }
  const fmt = (n: number) => n.toFixed(5);
  return `&bbox=${fmt(lonMin)},${fmt(latMin)},${fmt(lonMax)},${fmt(latMax)}`;
}


export default async function TripPage({ params, searchParams }: TripPageProps) {
  const { id } = await params;
  const { skipElevation: skipElevQs, as: asParticipantId } = await searchParams;
  const skipElevation = skipElevQs === "1" || skipElevQs === "true";

  const trip = await loadTrip(id);
  if (!trip) notFound();

  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const startISO = trip.startDate?.slice(0, 10) ?? null;
  const accepted = trip.participants.filter((p) => p.status === "accepted").length;
  const packingParticipants: PackingListParticipant[] = trip.participants.map(
    (p) => ({ id: p.id, name: p.name }),
  );
  const participantDays = Object.fromEntries(
    trip.participants.map((p) => [p.id, p.days ?? []]),
  );
  const mealDayLite = trip.mealPlan.map((d) => ({
    dayNumber: d.dayNumber,
    participantsToday: d.participantsToday,
    totalWeightGrams: d.meals.reduce(
      (acc, m) =>
        acc + m.ingredients.reduce((a, i) => a + (i.weightGrams ?? 0), 0),
      0,
    ),
  }));
  const consumablesLite = trip.consumables.map((c) => ({
    name: c.name,
    quantity: c.quantity,
    weightGrams: undefined,
    assignedTo: c.assignedTo,
  }));

  const nowcastStart = trip.cabins[0];
  const showNowcast =
    !trip.isDemo &&
    !!startISO &&
    !!nowcastStart &&
    isWithinTripWindow(startISO, trip.endDate ?? null);

  const sectionLabels: string[] = [
    !trip.isDemo && "Inviter deltakere",
    !trip.isDemo && trip.cabins.length >= 2 && "Inviter til én dag",
    !trip.isDemo && "Deltakere",
    "Hytter og etapper",
    "Eksporter til klokke / GPS",
    !trip.isDemo && "Hyttetilgjengelighet",
    !trip.isDemo && trip.cabins.length >= 2 && "Sammenlign hytter",
    showNowcast && nowcastStart && "Sanntidsvær (NowCast)",
    "Kart, tidslinje og vær",
    !trip.isDemo && "Pakkeliste",
    !trip.isDemo && "Matplan og handle",
    !trip.isDemo && "Bærevekt per person",
    !trip.isDemo && "Påminnelser",
    !trip.isDemo && "Nødkontakter (offline)",
    !trip.isDemo && "Utgifter",
    !trip.isDemo && trip.profile.length >= 2 && "Høydeprofil",
    !trip.isDemo && "Etter turen",
  ].filter((x): x is string => typeof x === "string");
  const navItems: TripSideNavItem[] = sectionLabels.map((label) => ({
    id: slugifyLabel(label),
    label,
  }));

  return (
    <main className="bg-bg min-h-screen">
      <MonsenSessionToast />
      <div className="max-w-6xl mx-auto px-md py-lg sm:px-lg sm:py-xl lg:flex lg:gap-lg lg:items-start">
        <TripSideNav items={navItems} />
        <div className="flex-1 min-w-0">
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
            <div className="flex items-start justify-between gap-md">
              <p
                className="text-sm opacity-90 uppercase tracking-label"
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                {[trip.area, dateRange].filter(Boolean).join(" - ") || "Klar for planlegging"}
              </p>
              {!trip.isDemo && (
                <Link
                  href={`/tur/${trip._id}/rediger`}
                  className="shrink-0 text-xs font-bold opacity-80 hover:opacity-100 border border-white/40 hover:border-white rounded px-sm py-1 transition-all"
                  style={{ fontFamily: "var(--font-stamp)" }}
                >
                  Rediger
                </Link>
              )}
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black leading-tight">
              {trip.title}
            </h1>
            {trip.participants.length > 0 && (
              <p className="text-sm opacity-90">
                {accepted} av {trip.participants.length} har sagt ja
              </p>
            )}
            <p
              className="text-sm opacity-95 mt-xs"
              style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
            >
              &ldquo;{randomQuip("panelHeader")}&rdquo; - Lars
            </p>
          </div>
        </header>

        <div className="grid gap-lg">
          {!trip.isDemo && (
            <Section label="Inviter deltakere">
              <InviteLink token={trip.inviteToken} />
            </Section>
          )}

          {!trip.isDemo && trip.cabins.length >= 2 && (
            <Section label="Inviter til én dag">
              <DayInviteLinks inviteToken={trip.inviteToken} cabins={trip.cabins} />
            </Section>
          )}

          {!trip.isDemo && (
            <Section label="Deltakere">
              <ParticipantsLive
                tripIdOrToken={trip.inviteToken}
                initialParticipants={trip.participants}
                variant="tur"
              />
            </Section>
          )}

          <Section label="Hytter og etapper">
            <CabinRouteEditor
              initialCabins={trip.cabins}
              tripId={trip._id}
              isDemo={trip.isDemo}
            />
            {!trip.isDemo && (
              <div className="mt-md flex flex-wrap items-center gap-sm">
                <Link
                  href={`/discover?addTo=${trip._id}&title=${encodeURIComponent(trip.title)}${cabinsBboxParam(trip.cabins)}`}
                  className="inline-flex items-center gap-xs rounded-md border-2 border-flame-pressed bg-bg px-md py-sm text-sm font-bold text-flame-pressed shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-transform"
                >
                  <span>🗺️</span>
                  Finn flere hytter på kart
                </Link>
                <span className="text-xs text-text-muted">
                  Åpner Discover med pågående tur i sikte.
                </span>
              </div>
            )}
          </Section>

          <Section label="Eksporter til klokke / GPS">
            <GpxExportButton
              tripIdOrToken={trip._id}
              cabinCount={trip.cabins.length}
            />
          </Section>

          {!trip.isDemo && (
            <Section label="Hyttetilgjengelighet">
              <CabinAvailability
                cabins={trip.cabins}
                persons={Math.max(1, trip.participants.length || 1)}
                startDate={trip.startDate ?? null}
                endDate={trip.endDate ?? null}
              />
            </Section>
          )}

          {!trip.isDemo && trip.cabins.length >= 2 && (
            <Section label="Sammenlign hytter">
              <CabinComparePanel
                tripId={trip._id}
                cabinCount={trip.cabins.length}
              />
            </Section>
          )}

          {showNowcast && nowcastStart && (
            <Section label="Sanntidsvær (NowCast)">
              <NowcastCard
                lat={nowcastStart.lat}
                lon={nowcastStart.lon}
                startName={nowcastStart.name}
              />
            </Section>
          )}

          <Section label="Kart, tidslinje og vær">
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
                <RouteMapAndTimeline
                  cabins={trip.cabins}
                  startDate={startISO}
                  skipElevation={skipElevation}
                />
              </Suspense>
            )}
          </Section>

          {!trip.isDemo && (
            <Section label="Pakkeliste">
              <PackingList
                tripId={trip._id}
                initialItems={trip.packingList}
                participants={packingParticipants}
                currentParticipantId={asParticipantId}
              />
            </Section>
          )}
          {!trip.isDemo && (
            <Section label="Matplan og handle">
              <MealPlanPanel
                tripId={trip._id}
                participants={packingParticipants}
                initialMealPlan={trip.mealPlan}
                initialShoppingList={trip.shoppingList}
                initialConsumables={trip.consumables}
              />
            </Section>
          )}
          {!trip.isDemo && (
            <Section label="Bærevekt per person">
              <WeightSummary
                participants={packingParticipants}
                packingList={trip.packingList}
                mealDays={mealDayLite}
                consumables={consumablesLite}
                participantDays={participantDays}
                totalDays={trip.totalDays}
              />
            </Section>
          )}
          {!trip.isDemo && (
            <Section label="Påminnelser">
              <RemindersPanel
                tripId={trip._id}
                startDate={trip.startDate}
                initialReminders={trip.reminders}
              />
            </Section>
          )}
          {!trip.isDemo && (
            <Section label="Nødkontakter (offline)">
              <EmergencyContactsPanel
                tripId={trip._id}
                initialContacts={trip.emergencyContacts}
              />
              <div className="mt-md">
                <Link
                  href={`/tur/${trip._id}/nodinfo`}
                  className="inline-flex items-center gap-xs rounded-md border-2 border-warning bg-warning-bg px-md py-sm text-sm font-bold text-warning shadow-[3px_3px_0_var(--accent-warning)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--accent-warning)] transition-transform"
                >
                  <span>🚨</span>
                  Åpne nødinfo-siden
                </Link>
              </div>
            </Section>
          )}
          {!trip.isDemo && (
            <Section label="Utgifter">
              <ExpensesPanel
                tripId={trip._id}
                initialParticipants={trip.participants.map<ExpensesPanelParticipant>(
                  (p) => ({ id: p.id, name: p.name, days: p.days }),
                )}
                initialExpenses={trip.expenses}
                totalDays={trip.totalDays}
              />
            </Section>
          )}

          {!trip.isDemo && trip.profile.length >= 2 && (
            <Section label="Høydeprofil">
              <p className="text-sm text-text-muted mb-sm">
                {trip.stats.distanceKm.toFixed(1)} km ·{" "}
                {trip.stats.elevationGain} hm samlet stigning ·{" "}
                {trip.stats.legCount} etapper
              </p>
              <ElevationProfile
                points={trip.profile}
                title="Cumulative stigning over avstand"
              />
              <div className="mt-md flex flex-wrap items-center gap-sm">
                <Link
                  href="/statistikk"
                  className="inline-flex items-center gap-xs rounded-md border-2 border-fjord bg-bg px-md py-sm text-sm font-bold text-fjord shadow-[3px_3px_0_var(--accent-fjord)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--accent-fjord)] transition-transform"
                >
                  <span>📊</span>
                  Sammenlign med andre turer
                </Link>
                <span className="text-xs text-text-muted">
                  Side om side på samme skala.
                </span>
              </div>
            </Section>
          )}

          {!trip.isDemo && (
            <Section label="Etter turen">
              <p
                className="text-text-primary text-lg leading-snug mb-md"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                {trip.isPast
                  ? "Turen er i logg. Vil du gjøre den igjen, eller se hvordan den slo seg sammenlignet med andre?"
                  : "Lyst til å lage en kopi for senere? Eller bygge neste års tur på samme rute?"}
              </p>
              <div className="flex flex-wrap items-center gap-md">
                <DuplicateTripButton
                  tripId={trip._id}
                  defaultTitle={trip.title}
                  defaultStart={trip.startDate?.slice(0, 10)}
                  defaultEnd={trip.endDate?.slice(0, 10)}
                  variant="panel"
                  label="Gjenta denne turen"
                />
                <Link
                  href="/statistikk"
                  className="inline-flex items-center gap-xs rounded-md border-2 border-fjord bg-bg px-md py-sm text-sm font-bold text-fjord shadow-[3px_3px_0_var(--accent-fjord)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--accent-fjord)] transition-transform"
                >
                  <span>📊</span>
                  Se statistikk og sammenlign
                </Link>
              </div>
            </Section>
          )}
        </div>
        </div>
      </div>
    </main>
  );
}

function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isWithinTripWindow(
  startISO: string,
  endISO: string | null,
): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today < startISO.slice(0, 10)) return false;
  if (endISO && today > endISO.slice(0, 10)) return false;
  return true;
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

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={slugifyLabel(label)}
      className="scroll-mt-xl bg-bg border-4 border-flame-pressed rounded-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] p-lg relative"
    >
      <div className="flex items-center gap-sm mb-md flex-wrap">
        <h2 className="font-heading font-bold text-h2 text-forest">
          {label}
        </h2>
      </div>
      <div className="text-text-primary text-body">{children}</div>
    </section>
  );
}
