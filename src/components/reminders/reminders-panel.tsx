"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MonsenToast } from "@/components/lars-monsen/monsen-toast";
import { randomQuip } from "@/lib/lars-monsen/quips";

export interface Reminder {
  _id?: string;
  daysBefore: number;
  label: string;
  kind: "pakk" | "handle" | "vær" | "annet";
}

interface Props {
  tripId: string;
  startDate?: string;
  initialReminders: Reminder[];
}

const PRESETS: Array<Omit<Reminder, "_id">> = [
  { daysBefore: 14, label: "Bestill mat og forbruksvarer", kind: "handle" },
  { daysBefore: 7, label: "Sjekk værvarsel og oppdater pakkelista", kind: "vær" },
  { daysBefore: 1, label: "Pakk sekken", kind: "pakk" },
];

const KIND_TONE: Record<Reminder["kind"], string> = {
  pakk: "bg-flame-tint text-flame",
  handle: "bg-forest-tint text-forest",
  vær: "bg-fjord-tint text-fjord",
  annet: "bg-bg-secondary text-text-muted",
};

export function RemindersPanel({ tripId, startDate, initialReminders }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [draftDays, setDraftDays] = useState(3);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftKind, setDraftKind] = useState<Reminder["kind"]>("annet");
  const [, startSaving] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<{ trigger: number; quip: string } | null>(
    null,
  );

  function fireToast(category: "reminderAdded" | "reminderDue") {
    setToast((prev) => ({
      trigger: (prev?.trigger ?? 0) + 1,
      quip: randomQuip(category),
    }));
  }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const startTs = startDate ? new Date(startDate).getTime() : null;
  const dueLabel = useMemo(() => {
    if (!startTs) return null;
    const diff = startTs - now;
    if (diff <= 0) return "Turen har startet";
    const days = Math.ceil(diff / 86400000);
    return `${days} dag(er) til avreise`;
  }, [startTs, now]);

  function persist(next: Reminder[]) {
    setReminders(next);
    startSaving(async () => {
      await fetch(`/api/trips/${tripId}/reminders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminders: next }),
      }).catch(() => {});
    });
  }

  function addPreset(p: Omit<Reminder, "_id">) {
    if (reminders.some((r) => r.label === p.label && r.daysBefore === p.daysBefore)) {
      return;
    }
    persist([...reminders, p]);
    fireToast("reminderAdded");
  }

  function addCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!draftLabel.trim()) return;
    persist([
      ...reminders,
      {
        daysBefore: Math.max(0, Math.round(draftDays)),
        label: draftLabel.trim(),
        kind: draftKind,
      },
    ]);
    setDraftLabel("");
    setDraftDays(3);
    setDraftKind("annet");
    fireToast("reminderAdded");
  }

  function remove(target: Reminder) {
    persist(reminders.filter((r) => r !== target));
  }

  const sorted = [...reminders].sort((a, b) => b.daysBefore - a.daysBefore);

  return (
    <div className="flex flex-col gap-md">
      {dueLabel && (
        <p className="rounded-md border border-fjord-tint bg-fjord-tint/40 p-sm text-sm font-semibold text-fjord">
          {dueLabel}
        </p>
      )}

      <div className="flex flex-wrap gap-sm">
        {PRESETS.map((p) => (
          <Button
            key={`${p.label}-${p.daysBefore}`}
            variant="outline"
            size="sm"
            onClick={() => addPreset(p)}
          >
            +{p.daysBefore}d {p.label.split(" ")[0]}
          </Button>
        ))}
      </div>

      <ul className="flex flex-col gap-xs">
        {sorted.map((r, idx) => {
          const fireTs =
            startTs !== null ? startTs - r.daysBefore * 86400000 : null;
          const fired = fireTs !== null && fireTs <= now;
          return (
            <li
              key={r._id ?? idx}
              className="flex flex-wrap items-center gap-sm rounded-md border border-border bg-bg p-sm"
            >
              <span
                className={`rounded-pill px-xs py-[2px] text-[10px] font-bold uppercase tracking-label ${KIND_TONE[r.kind]}`}
              >
                {r.kind}
              </span>
              <span className="font-heading text-sm text-text-primary">
                {r.daysBefore} dag(er) før
              </span>
              <span className="flex-1 min-w-[160px] text-sm text-text-primary">
                {r.label}
              </span>
              {fired && (
                <span className="rounded-pill bg-warning-bg px-xs py-[1px] text-[10px] font-bold uppercase tracking-label text-warning">
                  Aktiv nå
                </span>
              )}
              <button
                onClick={() => remove(r)}
                className="text-text-muted hover:text-warning text-xs"
                aria-label="Fjern"
              >
                ×
              </button>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className="text-sm text-text-muted">
            Ingen påminnelser. Bruk forslagene over eller lag en egen.
          </li>
        )}
      </ul>

      <MonsenToast trigger={toast?.trigger ?? null} quip={toast?.quip ?? null} />

      <form onSubmit={addCustom} className="flex flex-wrap items-center gap-sm">
        <input
          type="number"
          min={0}
          value={draftDays}
          onChange={(e) => setDraftDays(Number(e.target.value))}
          className="w-20 rounded-md border border-border bg-bg px-sm py-xs text-sm text-text-primary"
          aria-label="Dager før"
        />
        <span className="text-sm text-text-muted">dager før</span>
        <select
          value={draftKind}
          onChange={(e) => setDraftKind(e.target.value as Reminder["kind"])}
          className="rounded-md border border-border bg-bg px-sm py-xs text-sm text-text-primary"
        >
          <option value="pakk">Pakk</option>
          <option value="handle">Handle</option>
          <option value="vær">Vær</option>
          <option value="annet">Annet</option>
        </select>
        <input
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          placeholder="Hva skal varselet si?"
          className="flex-1 min-w-[200px] rounded-md border border-border bg-bg px-sm py-xs text-sm text-text-primary"
        />
        <Button type="submit" variant="outline" size="sm">
          Legg til
        </Button>
      </form>
    </div>
  );
}
