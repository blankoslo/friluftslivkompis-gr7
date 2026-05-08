import { Suspense } from "react";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  Trip,
  type IConsumable,
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
import { buildTimeline } from "@/lib/timeline";
import { TripTimelineView } from "@/components/timeline/timeline";
import { CabinRouteEditor } from "@/components/route/cabin-route-editor";
import { CabinAvailability } from "@/components/route/cabin-availability";
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
  totalDays: number | null;
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
      expenses: [],
      mealPlan: [],
      shoppingList: [],
      consumables: [],
      reminders: [],
      totalDays: DEMO_CABINS.length - 1,
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
    participants: (IParticipant & { _id: mongoose.Types.ObjectId })[];
    packingList?: (IPackingItem & { _id?: mongoose.Types.ObjectId })[];
    cabins?: ITripCabin[];
    expenses?: IExpense[];
    mealPlan?: IMealDay[];
    shoppingList?: (IShoppingItem & { _id?: mongoose.Types.ObjectId })[];
    consumables?: (IConsumable & { _id?: mongoose.Types.ObjectId })[];
    reminders?: (IReminder & { _id?: mongoose.Types.ObjectId })[];
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
    totalDays: computeTotalDays(doc.startDate, doc.endDate, cabins.length),
    isDemo: false,
  };
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

  return (
    <main className="bg-bg min-h-screen">
      <MonsenSessionToast />
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
            <Section label="Inviter deltakere" badge="G1">
              <InviteLink token={trip.inviteToken} />
            </Section>
          )}

          {!trip.isDemo && trip.cabins.length >= 2 && (
            <Section label="Inviter til én dag" badge="G9">
              <DayInviteLinks inviteToken={trip.inviteToken} cabins={trip.cabins} />
            </Section>
          )}

          {!trip.isDemo && (
            <Section label="Deltakere" badge="G1, G4">
              <ParticipantsLive
                tripIdOrToken={trip.inviteToken}
                initialParticipants={trip.participants}
                variant="tur"
              />
            </Section>
          )}

          <Section label="Hytter og etapper" badge="B3">
            <CabinRouteEditor
              initialCabins={trip.cabins}
              tripId={trip._id}
              isDemo={trip.isDemo}
            />
          </Section>

          {!trip.isDemo && (
            <Section label="Hyttetilgjengelighet" badge="B2">
              <CabinAvailability
                cabins={trip.cabins}
                persons={Math.max(1, trip.participants.length || 1)}
                startDate={trip.startDate ?? null}
                endDate={trip.endDate ?? null}
              />
            </Section>
          )}

          <Section label="Tidslinje og vær" badge="B1 / B6">
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
            <Section label="Pakkeliste" badge="P1, P2, P3">
              <PackingList
                tripId={trip._id}
                initialItems={trip.packingList}
                participants={packingParticipants}
                currentParticipantId={asParticipantId}
              />
            </Section>
          )}
          {!trip.isDemo && (
            <Section label="Matplan og handle" badge="P5, P5b, P7">
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
            <Section label="Bærevekt per person" badge="P6">
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
            <Section label="Påminnelser" badge="P4">
              <RemindersPanel
                tripId={trip._id}
                startDate={trip.startDate}
                initialReminders={trip.reminders}
              />
            </Section>
          )}
          {!trip.isDemo && (
            <Section label="Utgifter" badge="R1">
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
        </div>
      </div>
    </main>
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

function Section({
  label,
  badge,
  children,
}: {
  label: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-bg border-4 border-flame-pressed rounded-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] p-lg relative">
      <div className="flex items-center gap-sm mb-md flex-wrap">
        <h2 className="font-heading font-bold text-h2 text-forest">
          {label}
        </h2>
        <span
          className="text-xs font-bold px-sm py-1 rounded-pill uppercase tracking-label bg-forest text-white"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          {badge}
        </span>
      </div>
      <div className="text-text-primary text-body">{children}</div>
    </section>
  );
}
