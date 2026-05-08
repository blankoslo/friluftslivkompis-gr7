"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AiDisclosure,
  SourceBadge,
} from "@/components/ui/ai-disclosure";
import { randomQuip } from "@/lib/lars-monsen/quips";
import { MonsenToast } from "@/components/lars-monsen/monsen-toast";
import type { PackingListParticipant } from "@/components/packing/packing-list";

export interface MealPlanIngredient {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  weightGrams?: number;
}

export interface MealPlanMeal {
  type: "frokost" | "lunsj" | "middag" | "snack";
  name: string;
  ingredients: MealPlanIngredient[];
}

export interface MealPlanDay {
  dayNumber: number;
  participantsToday: number;
  meals: MealPlanMeal[];
}

export interface ShoppingListItem {
  _id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  bought: boolean;
  assignedTo?: string;
}

export interface ConsumableItem {
  _id?: string;
  name: string;
  quantity: number;
  unit: string;
  reason?: string;
  bought: boolean;
  assignedTo?: string;
}

interface Props {
  tripId: string;
  participants: PackingListParticipant[];
  initialMealPlan: MealPlanDay[];
  initialShoppingList: ShoppingListItem[];
  initialConsumables: ConsumableItem[];
}

type Tab = "matplan" | "handle" | "forbruk";

export function MealPlanPanel({
  tripId,
  participants,
  initialMealPlan,
  initialShoppingList,
  initialConsumables,
}: Props) {
  const [tab, setTab] = useState<Tab>("matplan");
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>(initialMealPlan);
  const [shopping, setShopping] = useState<ShoppingListItem[]>(initialShoppingList);
  const [consumables, setConsumables] = useState<ConsumableItem[]>(initialConsumables);
  const [intro, setIntro] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [, startSaving] = useTransition();
  const [loadingQuip] = useState(() => randomQuip("aiThinking"));
  const [toast, setToast] = useState<{ trigger: number; quip: string } | null>(
    null,
  );

  const hasPlan = mealPlan.length > 0;

  function generate() {
    setError(null);
    startGenerating(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/meal-plan`, {
          method: "POST",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Feil: ${res.status}`);
        }
        const data = (await res.json()) as {
          intro: string;
          mealPlan: MealPlanDay[];
          shoppingList: ShoppingListItem[];
          consumables: ConsumableItem[];
        };
        setMealPlan(data.mealPlan);
        setShopping(data.shoppingList);
        setConsumables(data.consumables);
        setIntro(data.intro);
        setToast({ trigger: Date.now(), quip: randomQuip("mealPlanReady") });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Klarte ikke å generere");
        setToast({ trigger: Date.now(), quip: randomQuip("errorGeneric") });
      }
    });
  }

  function patchShopping(item: ShoppingListItem, patch: Partial<ShoppingListItem>) {
    if (!item._id) return;
    const next = shopping.map((s) => (s === item ? { ...s, ...patch } : s));
    setShopping(next);
    startSaving(async () => {
      await fetch(`/api/trips/${tripId}/meal-plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shoppingList: [{ _id: item._id, ...patch }],
        }),
      }).catch(() => {});
    });
  }

  function patchConsumable(item: ConsumableItem, patch: Partial<ConsumableItem>) {
    if (!item._id) return;
    const next = consumables.map((c) => (c === item ? { ...c, ...patch } : c));
    setConsumables(next);
    startSaving(async () => {
      await fetch(`/api/trips/${tripId}/meal-plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumables: [{ _id: item._id, ...patch }],
        }),
      }).catch(() => {});
    });
  }

  return (
    <div className="flex flex-col gap-md">
      <MonsenToast trigger={toast?.trigger ?? null} quip={toast?.quip ?? null} />
      {intro && (
        <div className="flex flex-col gap-xs rounded-md bg-midnight-sun-tint p-md">
          <SourceBadge tone="ai" label="AI-tekst" className="self-start" />
          <p className="text-sm italic text-text-primary">{intro}</p>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-warning-border bg-warning-bg p-sm text-sm text-warning">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-sm flex-wrap">
        <div className="flex gap-sm">
          <TabButton active={tab === "matplan"} onClick={() => setTab("matplan")}>
            Matplan ({mealPlan.length} dager)
          </TabButton>
          <TabButton active={tab === "handle"} onClick={() => setTab("handle")}>
            Handleliste ({shopping.length})
          </TabButton>
          <TabButton active={tab === "forbruk"} onClick={() => setTab("forbruk")}>
            Forbruksvarer ({consumables.length})
          </TabButton>
        </div>
        <Button size="sm" onClick={generate} disabled={isGenerating}>
          {isGenerating
            ? loadingQuip
            : hasPlan
              ? "Generer på nytt"
              : "Generer matplan"}
        </Button>
      </div>

      {!hasPlan && (
        <AiDisclosure>
          Lars og Claude lager matplan, handleliste og forbruksvareliste i ett
          slag. Mengder skaleres etter antall personer per dag.
        </AiDisclosure>
      )}

      {tab === "matplan" && hasPlan && (
        <div className="flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <SourceBadge tone="ai" label="AI-generert" />
            <span className="text-xs text-text-muted">
              Måltider og mengder foreslått av Claude. Juster selv før innkjøp.
            </span>
          </div>
          {mealPlan.map((day) => (
            <DayCard key={day.dayNumber} day={day} />
          ))}
        </div>
      )}

      {tab === "handle" && (
        <div className="flex flex-col gap-sm">
          {shopping.length > 0 && (
            <div className="flex items-center gap-sm">
              <SourceBadge tone="ai" label="AI-generert" />
              <span className="text-xs text-text-muted">
                Handleliste utledet fra matplanen. Verifiser mengder før butikk.
              </span>
            </div>
          )}
          <ShoppingTable
            items={shopping}
            participants={participants}
            onPatch={patchShopping}
          />
        </div>
      )}

      {tab === "forbruk" && (
        <div className="flex flex-col gap-sm">
          {consumables.length > 0 && (
            <div className="flex items-center gap-sm">
              <SourceBadge tone="ai" label="AI-generert" />
              <span className="text-xs text-text-muted">
                Anslag på forbruksvarer fra Claude. Tilpass etter erfaring.
              </span>
            </div>
          )}
          <ConsumablesTable
            items={consumables}
            participants={participants}
            onPatch={patchConsumable}
          />
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-pill border px-sm py-xs text-xs font-bold uppercase tracking-label transition ${
        active
          ? "border-flame-primary bg-flame-primary text-white"
          : "border-border bg-bg text-text-muted hover:border-flame-primary hover:text-flame-primary"
      }`}
    >
      {children}
    </button>
  );
}

function DayCard({ day }: { day: MealPlanDay }) {
  const totalWeight = day.meals.reduce(
    (acc, m) =>
      acc +
      m.ingredients.reduce((a, i) => a + (i.weightGrams ?? 0), 0),
    0,
  );
  return (
    <section className="rounded-md border border-border bg-bg p-md">
      <div className="mb-sm flex items-center justify-between gap-sm">
        <h3 className="font-heading text-sm font-semibold text-text-primary">
          Dag {day.dayNumber} · {day.participantsToday} personer
        </h3>
        <span className="text-[11px] text-text-muted">
          ~{(totalWeight / 1000).toFixed(1)} kg mat
        </span>
      </div>
      <ul className="flex flex-col gap-sm">
        {day.meals.map((meal, idx) => (
          <li key={idx} className="border-l-2 border-fjord-tint pl-sm">
            <div className="flex items-center gap-sm">
              <span className="rounded-pill bg-fjord-tint px-xs py-[1px] text-[10px] font-bold uppercase tracking-label text-fjord">
                {meal.type}
              </span>
              <span className="text-sm font-semibold text-text-primary">
                {meal.name}
              </span>
            </div>
            <ul className="mt-xs text-[12px] text-text-muted flex flex-wrap gap-x-md gap-y-[2px]">
              {meal.ingredients.map((ing, i) => (
                <li key={i}>
                  {ing.name} {ing.quantity} {ing.unit}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShoppingTable({
  items,
  participants,
  onPatch,
}: {
  items: ShoppingListItem[];
  participants: PackingListParticipant[];
  onPatch: (item: ShoppingListItem, patch: Partial<ShoppingListItem>) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Ingen handleliste enda. Generer matplan for å fylle den.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-xs">
      {items.map((item, idx) => (
        <li
          key={item._id ?? idx}
          className="flex flex-wrap items-center gap-sm rounded-md border border-border bg-bg p-sm"
        >
          <input
            type="checkbox"
            checked={item.bought}
            onChange={() => onPatch(item, { bought: !item.bought })}
            className="size-4 accent-flame"
            aria-label={item.bought ? "Handlet" : "Marker som handlet"}
          />
          <span
            className={`flex-1 min-w-[180px] text-sm ${
              item.bought ? "text-text-muted line-through" : "text-text-primary"
            }`}
          >
            <span className="font-semibold">{item.name}</span>{" "}
            <span className="text-text-muted">
              {item.quantity} {item.unit}
            </span>
            {item.category && (
              <span className="ml-xs rounded-pill bg-bg-secondary px-xs py-[1px] text-[10px] uppercase tracking-label text-text-muted">
                {item.category}
              </span>
            )}
          </span>
          {participants.length > 0 && (
            <select
              value={item.assignedTo ?? ""}
              onChange={(e) =>
                onPatch(item, { assignedTo: e.target.value || undefined })
              }
              className="rounded-md border border-border bg-bg px-xs py-[2px] text-[11px] text-text-primary"
            >
              <option value="">Ingen handler</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </li>
      ))}
    </ul>
  );
}

function ConsumablesTable({
  items,
  participants,
  onPatch,
}: {
  items: ConsumableItem[];
  participants: PackingListParticipant[];
  onPatch: (item: ConsumableItem, patch: Partial<ConsumableItem>) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Ingen forbruksvarer enda. Genereres sammen med matplanen.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-xs">
      {items.map((item, idx) => (
        <li
          key={item._id ?? idx}
          className="flex flex-wrap items-center gap-sm rounded-md border border-border bg-bg p-sm"
        >
          <input
            type="checkbox"
            checked={item.bought}
            onChange={() => onPatch(item, { bought: !item.bought })}
            className="size-4 accent-flame"
          />
          <span
            className={`flex-1 min-w-[180px] text-sm ${
              item.bought ? "text-text-muted line-through" : "text-text-primary"
            }`}
          >
            <span className="font-semibold">{item.name}</span>{" "}
            <span className="text-text-muted">
              {item.quantity} {item.unit}
            </span>
            {item.reason && (
              <span className="block text-[11px] text-text-muted italic">
                {item.reason}
              </span>
            )}
          </span>
          {participants.length > 0 && (
            <select
              value={item.assignedTo ?? ""}
              onChange={(e) =>
                onPatch(item, { assignedTo: e.target.value || undefined })
              }
              className="rounded-md border border-border bg-bg px-xs py-[2px] text-[11px] text-text-primary"
            >
              <option value="">Ingen kjøper</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </li>
      ))}
    </ul>
  );
}
