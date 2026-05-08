"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AiDisclosure,
  SourceBadge,
} from "@/components/ui/ai-disclosure";
import { randomQuip } from "@/lib/lars-monsen/quips";

export interface PackingItem {
  _id?: string;
  name: string;
  packed: boolean;
  isAiSuggested: boolean;
  quantity?: number;
  category?: string;
  isShared?: boolean;
  weightGrams?: number;
  reason?: string;
  assignedTo?: string;
  isNew?: boolean;
}

export interface PackingListParticipant {
  id: string;
  name: string;
}

interface Props {
  tripId: string;
  initialItems: PackingItem[];
  participants: PackingListParticipant[];
  currentParticipantId?: string;
}

type Mode = "alle" | "min" | "fellesutstyr";

export function PackingList({
  tripId,
  initialItems,
  participants,
  currentParticipantId,
}: Props) {
  const [items, setItems] = useState<PackingItem[]>(initialItems);
  const [intro, setIntro] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [mode, setMode] = useState<Mode>(currentParticipantId ? "min" : "alle");
  const [activeParticipant, setActiveParticipant] = useState<string | undefined>(
    currentParticipantId,
  );
  const [fallbackIntro] = useState(() => randomQuip("packingIntro"));
  const [loadingQuip] = useState(() => randomQuip("loading"));

  const filtered = useMemo(() => {
    if (mode === "fellesutstyr") return items.filter((i) => i.isShared);
    if (mode === "min" && activeParticipant) {
      return items.filter(
        (i) =>
          i.assignedTo === activeParticipant ||
          (!i.isShared && !i.assignedTo && !i.isAiSuggested),
      );
    }
    return items;
  }, [items, mode, activeParticipant]);

  const aiItems = filtered.filter((i) => i.isAiSuggested);
  const userItems = filtered.filter((i) => !i.isAiSuggested);
  const sharedItems = filtered.filter((i) => i.isShared);
  const packedCount = filtered.filter((i) => i.packed).length;
  const totalWeight = filtered.reduce(
    (acc, i) => acc + (i.weightGrams ?? 0) * (i.quantity ?? 1),
    0,
  );

  function generate() {
    setError(null);
    startGenerating(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/packing`, {
          method: "POST",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Feil: ${res.status}`);
        }
        const data = (await res.json()) as {
          intro: string;
          packingList: PackingItem[];
        };
        const previousIds = new Set(
          items.filter((i) => i.isAiSuggested).map((i) => i.name.toLowerCase()),
        );
        setItems(
          data.packingList.map((item) => ({
            ...item,
            isNew:
              item.isAiSuggested && !previousIds.has(item.name.toLowerCase()),
          })),
        );
        setIntro(data.intro);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Klarte ikke å generere");
      }
    });
  }

  function persist(next: PackingItem[]) {
    startSaving(async () => {
      const res = await fetch(`/api/trips/${tripId}/packing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packingList: next }),
      });
      if (res.ok) {
        const data = (await res.json()) as { packingList: PackingItem[] };
        setItems(data.packingList);
      }
    });
  }

  function updateItem(target: PackingItem, patch: Partial<PackingItem>) {
    const next = items.map((item) =>
      item === target ? { ...item, ...patch } : item,
    );
    setItems(next);
    persist(next);
  }

  function removeItem(target: PackingItem) {
    const next = items.filter((item) => item !== target);
    setItems(next);
    persist(next);
  }

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) return;
    const next: PackingItem[] = [
      ...items,
      { name, packed: false, isAiSuggested: false, quantity: 1, isNew: true },
    ];
    setItems(next);
    setNewItemName("");
    persist(next);
  }

  return (
    <div className="flex flex-col gap-md">
      {(intro || items.length === 0) && (
        <div className="flex flex-col gap-xs rounded-md bg-midnight-sun-tint p-md">
          {intro && <SourceBadge tone="ai" label="AI-tekst" className="self-start" />}
          <p className="text-sm italic text-text-primary">
            {intro ?? fallbackIntro}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-warning-border bg-warning-bg p-sm text-sm text-warning">
          {error}
        </p>
      )}

      {participants.length > 0 && (
        <div className="flex flex-wrap items-center gap-sm">
          <ModeButton active={mode === "alle"} onClick={() => setMode("alle")}>
            Alle
          </ModeButton>
          <ModeButton
            active={mode === "fellesutstyr"}
            onClick={() => setMode("fellesutstyr")}
          >
            Fellesutstyr
          </ModeButton>
          <ModeButton active={mode === "min"} onClick={() => setMode("min")}>
            Min liste
          </ModeButton>
          {mode === "min" && (
            <select
              value={activeParticipant ?? ""}
              onChange={(e) => setActiveParticipant(e.target.value || undefined)}
              className="rounded-md border border-border bg-bg px-sm py-xs text-sm text-text-primary"
            >
              <option value="">Velg deltaker…</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-sm flex-wrap">
        <p className="text-sm text-text-muted">
          {filtered.length} ting · {packedCount} pakket · {(totalWeight / 1000).toFixed(1)} kg
          {isSaving && " · lagrer…"}
        </p>
        <Button
          variant="default"
          size="sm"
          onClick={generate}
          disabled={isGenerating}
        >
          {isGenerating
            ? loadingQuip
            : items.some((i) => i.isAiSuggested)
              ? "Generer på nytt"
              : "Generer pakkeliste"}
        </Button>
      </div>

      {mode !== "fellesutstyr" && aiItems.length > 0 && (
        <Section title="AI-foreslått" tone="ai" badge="Monsen-AI">
          <AiDisclosure className="mb-sm">
            Forslag fra Claude tilpasset vær, varighet og gruppe. Mengder og vekt
            er anslag, du bestemmer hva som havner i sekken.
          </AiDisclosure>
          <ul className="flex flex-col gap-xs">
            {aiItems.map((item, idx) => (
              <Row
                key={item._id ?? `ai-${idx}`}
                item={item}
                participants={participants}
                disableAssign={mode === "min"}
                onToggle={() => updateItem(item, { packed: !item.packed })}
                onAssign={(id) => updateItem(item, { assignedTo: id })}
                onRemove={() => removeItem(item)}
                ai
              />
            ))}
          </ul>
        </Section>
      )}

      {mode === "fellesutstyr" && (
        <Section title="Fellesutstyr" tone="data" badge="Felles">
          <ul className="flex flex-col gap-xs">
            {sharedItems.map((item, idx) => (
              <Row
                key={item._id ?? `shared-${idx}`}
                item={item}
                participants={participants}
                onToggle={() => updateItem(item, { packed: !item.packed })}
                onAssign={(id) => updateItem(item, { assignedTo: id })}
                onRemove={() => removeItem(item)}
                ai={item.isAiSuggested}
              />
            ))}
            {sharedItems.length === 0 && (
              <li className="text-sm text-text-muted">
                Ingen fellesutstyr enda. Generer pakkeliste eller marker en
                gjenstand som «felles».
              </li>
            )}
          </ul>
        </Section>
      )}

      {mode !== "fellesutstyr" && (
        <Section title="Lagt til av deg" tone="data" badge="Eget">
          <ul className="flex flex-col gap-xs">
            {userItems.map((item, idx) => (
              <Row
                key={item._id ?? `user-${idx}`}
                item={item}
                participants={participants}
                disableAssign={mode === "min"}
                onToggle={() => updateItem(item, { packed: !item.packed })}
                onAssign={(id) => updateItem(item, { assignedTo: id })}
                onRemove={() => removeItem(item)}
                ai={false}
              />
            ))}
            {userItems.length === 0 && (
              <li className="text-sm text-text-muted">Ingen egne ting enda.</li>
            )}
          </ul>

          {mode !== "min" && (
            <form onSubmit={addItem} className="mt-sm flex gap-sm">
              <input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Legg til ting…"
                className="flex-1 rounded-md border border-border bg-bg px-sm py-xs text-sm text-text-primary placeholder:text-text-muted focus:border-flame focus:outline-none"
              />
              <Button type="submit" variant="outline" size="sm">
                Legg til
              </Button>
            </form>
          )}
        </Section>
      )}
    </div>
  );
}

function ModeButton({
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

function Section({
  title,
  badge,
  tone,
  children,
}: {
  title: string;
  badge: string;
  tone: "ai" | "data";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-bg p-md">
      <div className="mb-sm flex items-center gap-sm">
        <h3 className="font-heading text-sm font-semibold text-text-primary">
          {title}
        </h3>
        <SourceBadge tone={tone} label={badge} />
      </div>
      {children}
    </section>
  );
}

function Row({
  item,
  participants,
  onToggle,
  onAssign,
  onRemove,
  disableAssign,
  ai,
}: {
  item: PackingItem;
  participants: PackingListParticipant[];
  onToggle: () => void;
  onAssign: (id: string) => void;
  onRemove: () => void;
  disableAssign?: boolean;
  ai: boolean;
}) {
  const weight = item.weightGrams ? item.weightGrams * (item.quantity ?? 1) : 0;
  return (
    <li className="flex flex-wrap items-center gap-sm">
      <input
        type="checkbox"
        checked={item.packed}
        onChange={onToggle}
        className="size-4 accent-flame"
        aria-label={item.packed ? "Avkrysset" : "Kvitter ut"}
      />
      <span
        className={`flex-1 min-w-[160px] text-sm ${
          item.packed ? "text-text-muted line-through" : "text-text-primary"
        }`}
      >
        {item.name}
        {item.isShared && (
          <span className="ml-xs rounded-pill bg-fjord-tint px-xs py-[1px] text-[10px] font-bold uppercase tracking-label text-fjord">
            Felles
          </span>
        )}
        {item.isNew && (
          <span className="ml-xs rounded-pill bg-warning-bg px-xs py-[1px] text-[10px] font-bold uppercase tracking-label text-warning">
            Ny
          </span>
        )}
        {item.reason && (
          <span className="block text-[11px] text-text-muted italic">
            {item.reason}
          </span>
        )}
      </span>
      {weight > 0 && (
        <span className="text-[11px] text-text-muted whitespace-nowrap">
          {weight >= 1000 ? `${(weight / 1000).toFixed(1)} kg` : `${weight} g`}
        </span>
      )}
      {ai && <SourceBadge tone="ai" label="AI" />}
      {!disableAssign && participants.length > 0 && (
        <select
          value={item.assignedTo ?? ""}
          onChange={(e) => onAssign(e.target.value)}
          className="rounded-md border border-border bg-bg px-xs py-[2px] text-[11px] text-text-primary"
        >
          <option value="">Ikke tildelt</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={onRemove}
        className="text-text-muted hover:text-warning text-xs"
        aria-label="Fjern"
      >
        ×
      </button>
    </li>
  );
}
