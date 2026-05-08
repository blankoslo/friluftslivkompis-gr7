"use client";

import { useMemo } from "react";
import { SourceBadge } from "@/components/ui/ai-disclosure";
import type { PackingItem, PackingListParticipant } from "./packing-list";

interface MealDayLite {
  dayNumber: number;
  participantsToday: number;
  totalWeightGrams: number;
}

interface ConsumableLite {
  name: string;
  quantity: number;
  weightGrams?: number;
  assignedTo?: string;
}

interface Props {
  participants: PackingListParticipant[];
  packingList: PackingItem[];
  mealDays?: MealDayLite[];
  consumables?: ConsumableLite[];
  participantDays?: Record<string, number[]>;
  totalDays?: number | null;
}

interface Row {
  id: string;
  name: string;
  personalGrams: number;
  sharedGrams: number;
  foodGrams: number;
  consumablesGrams: number;
  total: number;
}

export function WeightSummary({
  participants,
  packingList,
  mealDays,
  consumables,
  participantDays,
}: Props) {
  const rows = useMemo<Row[]>(() => {
    if (participants.length === 0) return [];

    const personalByParticipant = new Map<string, number>();
    const sharedByParticipant = new Map<string, number>();

    for (const item of packingList) {
      const total = (item.weightGrams ?? 0) * (item.quantity ?? 1);
      if (total === 0) continue;
      if (item.isShared) {
        if (item.assignedTo) {
          sharedByParticipant.set(
            item.assignedTo,
            (sharedByParticipant.get(item.assignedTo) ?? 0) + total,
          );
        }
      } else {
        if (item.assignedTo) {
          personalByParticipant.set(
            item.assignedTo,
            (personalByParticipant.get(item.assignedTo) ?? 0) + total,
          );
        } else {
          for (const p of participants) {
            personalByParticipant.set(
              p.id,
              (personalByParticipant.get(p.id) ?? 0) + total / participants.length,
            );
          }
        }
      }
    }

    const foodByParticipant = new Map<string, number>();
    if (mealDays && mealDays.length > 0) {
      for (const day of mealDays) {
        const here = participants.filter((p) => {
          const days = participantDays?.[p.id];
          if (!days || days.length === 0) return true;
          return days.includes(day.dayNumber);
        });
        if (here.length === 0) continue;
        const perPerson = day.totalWeightGrams / here.length;
        for (const p of here) {
          foodByParticipant.set(
            p.id,
            (foodByParticipant.get(p.id) ?? 0) + perPerson,
          );
        }
      }
    }

    const consumablesByParticipant = new Map<string, number>();
    if (consumables && consumables.length > 0) {
      for (const c of consumables) {
        const total = (c.weightGrams ?? 0) * (c.quantity ?? 1);
        if (total === 0) continue;
        if (c.assignedTo) {
          consumablesByParticipant.set(
            c.assignedTo,
            (consumablesByParticipant.get(c.assignedTo) ?? 0) + total,
          );
        } else {
          for (const p of participants) {
            consumablesByParticipant.set(
              p.id,
              (consumablesByParticipant.get(p.id) ?? 0) + total / participants.length,
            );
          }
        }
      }
    }

    return participants.map((p) => {
      const personal = personalByParticipant.get(p.id) ?? 0;
      const shared = sharedByParticipant.get(p.id) ?? 0;
      const food = foodByParticipant.get(p.id) ?? 0;
      const cons = consumablesByParticipant.get(p.id) ?? 0;
      return {
        id: p.id,
        name: p.name,
        personalGrams: personal,
        sharedGrams: shared,
        foodGrams: food,
        consumablesGrams: cons,
        total: personal + shared + food + cons,
      };
    });
  }, [participants, packingList, mealDays, consumables, participantDays]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Legg til deltakere for å se vektfordeling.
      </p>
    );
  }

  const totals = rows.map((r) => r.total).filter((n) => n > 0);
  const max = totals.length > 0 ? Math.max(...totals) : 0;
  const min = totals.length > 0 ? Math.min(...totals) : 0;
  const imbalance = max > 0 && min > 0 ? (max - min) / max : 0;

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-center gap-sm">
        <SourceBadge tone="data" label="Beregning" />
        <p className="text-xs text-text-muted">
          Anslått bærevekt = personlig + tildelt fellesutstyr + matandel + forbruksvarer.
        </p>
      </div>
      <ul className="flex flex-col gap-xs">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-md border border-border bg-bg p-sm"
          >
            <div className="flex items-center justify-between gap-sm">
              <span className="font-semibold text-text-primary">{row.name}</span>
              <span className="font-heading text-h3 text-flame-primary">
                {(row.total / 1000).toFixed(1)} kg
              </span>
            </div>
            <div className="mt-xs text-[11px] text-text-muted flex flex-wrap gap-sm">
              <span>Personlig {(row.personalGrams / 1000).toFixed(1)} kg</span>
              <span>Felles {(row.sharedGrams / 1000).toFixed(1)} kg</span>
              <span>Mat {(row.foodGrams / 1000).toFixed(1)} kg</span>
              <span>Forbruk {(row.consumablesGrams / 1000).toFixed(1)} kg</span>
            </div>
            {max > 0 && (
              <div className="mt-xs h-1 w-full rounded-pill bg-bg-secondary overflow-hidden">
                <div
                  className="h-full bg-flame-primary"
                  style={{ width: `${(row.total / max) * 100}%` }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      {imbalance > 0.3 && (
        <p className="rounded-md border border-warning-border bg-warning-bg p-sm text-sm text-warning">
          Stor forskjell ({Math.round(imbalance * 100)} %) mellom tyngste og letteste
          sekk. Vurder å flytte fellesutstyr fra de tunge til de lette.
        </p>
      )}
    </div>
  );
}
