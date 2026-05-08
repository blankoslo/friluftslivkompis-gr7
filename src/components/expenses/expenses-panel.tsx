"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  computeSplit,
  type SplitExpense,
  type SplitParticipant,
} from "@/lib/expenses/split";
import { randomQuip } from "@/lib/lars-monsen/quips";

export interface ExpensesPanelParticipant {
  id: string;
  name: string;
  days?: number[];
}

export interface ExpensesPanelExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  dayNumber?: number | null;
  createdAt?: string;
}

interface Props {
  tripId: string;
  initialParticipants: ExpensesPanelParticipant[];
  initialExpenses: ExpensesPanelExpense[];
  totalDays: number | null;
}

const NOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 0,
});

export function ExpensesPanel({
  tripId,
  initialParticipants,
  initialExpenses,
  totalDays,
}: Props) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [emptyQuip] = useState(() => randomQuip("expenses"));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const dayOptions = useMemo(() => {
    if (totalDays && totalDays > 0) {
      return Array.from({ length: totalDays }, (_, i) => i + 1);
    }
    const max = Math.max(
      0,
      ...expenses.map((e) => e.dayNumber ?? 0),
      ...participants.flatMap((p) => p.days ?? []),
    );
    if (max === 0) return [];
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [totalDays, expenses, participants]);

  const split = useMemo(() => {
    const splitParticipants: SplitParticipant[] = participants.map((p) => ({
      id: p.id,
      name: p.name,
      days: p.days,
    }));
    const splitExpenses: SplitExpense[] = expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      paidBy: e.paidBy,
      splitAmong: e.splitAmong,
      dayNumber: e.dayNumber ?? null,
    }));
    return computeSplit(splitParticipants, splitExpenses);
  }, [participants, expenses]);

  if (participants.length === 0) {
    return (
      <p
        className="text-text-primary text-lg leading-snug"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        Inviter folk først, så får dere noe å splitte. {emptyQuip}
      </p>
    );
  }

  async function addExpense(payload: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
    dayNumber?: number;
  }) {
    setError(null);
    const res = await fetch(`/api/trips/${tripId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Klarte ikke å lagre utgift");
      return false;
    }
    const trip = await res.json();
    syncFromTrip(trip);
    return true;
  }

  async function removeExpense(expenseId: string) {
    setError(null);
    const res = await fetch(
      `/api/trips/${tripId}/expenses?expenseId=${expenseId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      setError("Klarte ikke å slette utgift");
      return;
    }
    const trip = await res.json();
    syncFromTrip(trip);
  }

  async function updateDays(participantId: string, days: number[]) {
    setError(null);
    const previous = participants;
    setParticipants((curr) =>
      curr.map((p) => (p.id === participantId ? { ...p, days } : p)),
    );
    startSaving(async () => {
      const res = await fetch(`/api/trips/${tripId}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, days }),
      });
      if (!res.ok) {
        setError("Klarte ikke å lagre dager");
        setParticipants(previous);
      }
    });
  }

  function syncFromTrip(trip: {
    participants: Array<{
      _id: string;
      name: string;
      days?: number[];
    }>;
    expenses: Array<{
      _id: string;
      description: string;
      amount: number;
      paidBy: string;
      splitAmong: string[];
      dayNumber?: number | null;
      createdAt?: string;
    }>;
  }) {
    setParticipants(
      trip.participants.map((p) => ({
        id: String(p._id),
        name: p.name,
        days: p.days,
      })),
    );
    setExpenses(
      trip.expenses.map((e) => ({
        id: String(e._id),
        description: e.description,
        amount: e.amount,
        paidBy: String(e.paidBy),
        splitAmong: (e.splitAmong ?? []).map((s) => String(s)),
        dayNumber: e.dayNumber ?? null,
        createdAt: e.createdAt,
      })),
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <ExpenseForm
        participants={participants}
        dayOptions={dayOptions}
        onSubmit={addExpense}
      />

      {error && (
        <p className="rounded-md border-2 border-warning-border bg-warning-bg p-sm text-sm text-warning">
          {error}
        </p>
      )}

      {dayOptions.length > 0 && (
        <DaysEditor
          participants={participants}
          dayOptions={dayOptions}
          onChange={updateDays}
          isSaving={isSaving}
        />
      )}

      <ExpenseList
        expenses={expenses}
        participants={participants}
        onRemove={removeExpense}
      />

      <SettlementPanel
        balances={split.balances}
        settlements={split.settlements}
        totalSpent={split.totalSpent}
        warnings={split.warnings}
      />
    </div>
  );
}

function ExpenseForm({
  participants,
  dayOptions,
  onSubmit,
}: {
  participants: ExpensesPanelParticipant[];
  dayOptions: number[];
  onSubmit: (payload: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
    dayNumber?: number;
  }) => Promise<boolean>;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(participants[0]?.id ?? "");
  const [dayNumber, setDayNumber] = useState<string>("");
  const [splitAmong, setSplitAmong] = useState<string[]>(
    participants.map((p) => p.id),
  );
  const [isSubmitting, startSubmitting] = useTransition();

  function toggleSplitter(pid: string) {
    setSplitAmong((curr) =>
      curr.includes(pid) ? curr.filter((id) => id !== pid) : [...curr, pid],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount.replace(",", "."));
    if (
      !description.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !paidBy
    ) {
      return;
    }
    const dayValue = dayNumber ? Number(dayNumber) : undefined;
    startSubmitting(async () => {
      const ok = await onSubmit({
        description: description.trim(),
        amount: numericAmount,
        paidBy,
        splitAmong,
        dayNumber: dayValue,
      });
      if (ok) {
        setDescription("");
        setAmount("");
        setDayNumber("");
        setSplitAmong(participants.map((p) => p.id));
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-sm rounded-md border-2 border-flame-pressed bg-bg p-md shadow-[2px_2px_0_var(--brand-flame-pressed)]"
    >
      <div className="grid gap-sm sm:grid-cols-[2fr_1fr]">
        <Field label="Beskrivelse">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bål-ved, hytteleie, mat..."
            className={inputClass}
            required
          />
        </Field>
        <Field label="Beløp (NOK)">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className={inputClass}
            required
          />
        </Field>
      </div>

      <div className="grid gap-sm sm:grid-cols-2">
        <Field label="Lagt ut av">
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className={inputClass}
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dag (valgfritt)">
          <select
            value={dayNumber}
            onChange={(e) => setDayNumber(e.target.value)}
            className={inputClass}
          >
            <option value="">Hele turen</option>
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                Dag {d}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <p className="mb-xs text-xs uppercase tracking-label text-text-muted">
          Splittes på
        </p>
        <div className="flex flex-wrap gap-xs">
          {participants.map((p) => {
            const active = splitAmong.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleSplitter(p.id)}
                className={`rounded-pill border-2 px-sm py-1 text-xs font-bold uppercase tracking-label transition-all ${
                  active
                    ? "border-flame-pressed bg-flame-primary text-white"
                    : "border-flame-pressed bg-bg text-text-primary hover:bg-flame-tint"
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Lagrer..." : "Legg til utgift"}
        </Button>
      </div>
    </form>
  );
}

function ExpenseList({
  expenses,
  participants,
  onRemove,
}: {
  expenses: ExpensesPanelExpense[];
  participants: ExpensesPanelParticipant[];
  onRemove: (id: string) => void;
}) {
  if (expenses.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Ingen utgifter registrert enda.
      </p>
    );
  }
  const nameOf = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? "Ukjent";

  return (
    <ul className="grid gap-sm">
      {expenses.map((e) => (
        <li
          key={e.id}
          className="flex flex-col gap-xs rounded-md border-2 border-flame-pressed bg-bg px-md py-sm shadow-[2px_2px_0_var(--brand-flame-pressed)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-text-primary">
              {e.description}
            </span>
            <span className="text-xs text-text-muted">
              {nameOf(e.paidBy)} la ut
              {e.dayNumber ? ` · dag ${e.dayNumber}` : " · hele turen"}
              {e.splitAmong.length > 0
                ? ` · ${e.splitAmong.length} deler`
                : " · alle deler"}
            </span>
          </div>
          <div className="flex items-center gap-sm">
            <span className="font-heading text-h3 text-flame-primary">
              {NOK.format(e.amount)}
            </span>
            <button
              onClick={() => onRemove(e.id)}
              className="text-text-muted hover:text-warning text-sm"
              aria-label="Slett utgift"
            >
              ×
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SettlementPanel({
  balances,
  settlements,
  totalSpent,
  warnings,
}: {
  balances: ReturnType<typeof computeSplit>["balances"];
  settlements: ReturnType<typeof computeSplit>["settlements"];
  totalSpent: number;
  warnings: string[];
}) {
  return (
    <div className="rounded-md border-2 border-forest bg-forest-tint p-md shadow-[2px_2px_0_var(--accent-forest)]">
      <div className="flex items-center justify-between gap-sm flex-wrap">
        <h3
          className="font-heading text-h3 font-bold text-forest"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Splitt-beregning
        </h3>
        <span
          className="text-xs uppercase tracking-label text-text-muted"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          Totalt {NOK.format(totalSpent)}
        </span>
      </div>

      <div className="mt-sm grid gap-xs">
        {balances.map((b) => {
          const tone =
            b.net > 0.5
              ? "text-forest"
              : b.net < -0.5
                ? "text-flame-primary"
                : "text-text-muted";
          const label =
            b.net > 0.5
              ? `+${NOK.format(b.net)} til gode`
              : b.net < -0.5
                ? `${NOK.format(b.net)} skylder`
                : "Kvitt";
          return (
            <div
              key={b.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-text-primary">{b.name}</span>
              <span className={`font-semibold ${tone}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {settlements.length > 0 ? (
        <div className="mt-md">
          <p
            className="mb-xs text-xs uppercase tracking-label text-text-muted"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            Slik gjør dere opp ({settlements.length}{" "}
            {settlements.length === 1 ? "transaksjon" : "transaksjoner"})
          </p>
          <ul className="grid gap-xs">
            {settlements.map((s, i) => (
              <li
                key={`${s.from}-${s.to}-${i}`}
                className="flex items-center justify-between rounded-md bg-bg px-sm py-1 text-sm"
              >
                <span className="text-text-primary">
                  <strong>{s.fromName}</strong> → <strong>{s.toName}</strong>
                </span>
                <span className="font-heading font-bold text-forest">
                  {NOK.format(s.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-sm text-sm text-text-muted">
          Ingen oppgjør nødvendig. Dere er kvitt.
        </p>
      )}

      {warnings.length > 0 && (
        <ul className="mt-sm grid gap-xs">
          {warnings.map((w, i) => (
            <li key={i} className="text-xs text-warning">
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DaysEditor({
  participants,
  dayOptions,
  onChange,
  isSaving,
}: {
  participants: ExpensesPanelParticipant[];
  dayOptions: number[];
  onChange: (participantId: string, days: number[]) => void;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border-2 border-fjord bg-fjord-tint p-md">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span
          className="text-xs uppercase tracking-label text-fjord font-bold"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          Dager per deltaker {isSaving && "· lagrer..."}
        </span>
        <span className="text-fjord text-sm">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-sm grid gap-sm">
          <p className="text-xs text-text-muted">
            Tom = hele turen. Velg dager kun hvis noen var med deler av turen.
          </p>
          {participants.map((p) => {
            const active = new Set(p.days ?? []);
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-sm">
                <span className="text-sm font-semibold text-text-primary min-w-24">
                  {p.name}
                </span>
                <div className="flex flex-wrap gap-xs">
                  {dayOptions.map((d) => {
                    const on = active.has(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const next = on
                            ? Array.from(active).filter((x) => x !== d)
                            : [...Array.from(active), d];
                          onChange(
                            p.id,
                            next.sort((a, b) => a - b),
                          );
                        }}
                        className={`rounded-sm border-2 px-sm py-0.5 text-xs font-bold transition-all ${
                          on
                            ? "border-fjord bg-fjord text-white"
                            : "border-fjord bg-bg text-fjord hover:bg-fjord-tint"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                  {active.size > 0 && (
                    <button
                      type="button"
                      onClick={() => onChange(p.id, [])}
                      className="text-xs text-text-muted underline"
                    >
                      hele turen
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-xs uppercase tracking-label text-text-muted"
        style={{ fontFamily: "var(--font-stamp)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "rounded-md border-2 border-flame-pressed bg-bg px-sm py-xs text-sm text-text-primary placeholder:text-text-muted focus:border-flame focus:outline-none";
