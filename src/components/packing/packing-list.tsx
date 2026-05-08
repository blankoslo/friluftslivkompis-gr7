"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AiDisclosure,
  SourceBadge,
} from "@/components/ui/ai-disclosure";
import { randomQuip } from "@/lib/lars-monsen/quips";

export interface PackingItem {
  name: string;
  packed: boolean;
  isAiSuggested: boolean;
}

interface Props {
  tripId: string;
  initialItems: PackingItem[];
}

export function PackingList({ tripId, initialItems }: Props) {
  const [items, setItems] = useState<PackingItem[]>(initialItems);
  const [intro, setIntro] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [fallbackIntro] = useState(() => randomQuip("packingIntro"));
  const [loadingQuip] = useState(() => randomQuip("loading"));

  const aiItems = items.filter((i) => i.isAiSuggested);
  const userItems = items.filter((i) => !i.isAiSuggested);
  const packedCount = items.filter((i) => i.packed).length;

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
        setItems(data.packingList);
        setIntro(data.intro);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Klarte ikke å generere");
      }
    });
  }

  function persist(next: PackingItem[]) {
    startSaving(async () => {
      await fetch(`/api/trips/${tripId}/packing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packingList: next }),
      }).catch(() => {});
    });
  }

  function togglePacked(index: number) {
    const next = items.map((item, i) =>
      i === index ? { ...item, packed: !item.packed } : item,
    );
    setItems(next);
    persist(next);
  }

  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    persist(next);
  }

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) return;
    const next: PackingItem[] = [
      ...items,
      { name, packed: false, isAiSuggested: false },
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

      <div className="flex items-center justify-between gap-sm">
        <p className="text-sm text-text-muted">
          {items.length} ting · {packedCount} pakket
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
            : aiItems.length > 0
              ? "Generer på nytt"
              : "Generer pakkeliste"}
        </Button>
      </div>

      {aiItems.length > 0 && (
        <Section title="AI-foreslått" tone="ai" badge="Monsen-AI">
          <AiDisclosure className="mb-sm">
            Forslag fra Claude basert på vær, varighet og gruppestørrelse. Det
            er anslag, ikke fasit, du bestemmer hva som faktisk havner i
            sekken.
          </AiDisclosure>
          <ul className="flex flex-col gap-xs">
            {items.map((item, idx) =>
              item.isAiSuggested ? (
                <Row
                  key={`ai-${idx}`}
                  item={item}
                  onToggle={() => togglePacked(idx)}
                  onRemove={() => removeItem(idx)}
                  ai
                />
              ) : null,
            )}
          </ul>
        </Section>
      )}

      <Section title="Lagt til av deg" tone="data" badge="Eget">
        <ul className="flex flex-col gap-xs">
          {items.map((item, idx) =>
            !item.isAiSuggested ? (
              <Row
                key={`user-${idx}`}
                item={item}
                onToggle={() => togglePacked(idx)}
                onRemove={() => removeItem(idx)}
                ai={false}
              />
            ) : null,
          )}
          {userItems.length === 0 && (
            <li className="text-sm text-text-muted">Ingen egne ting enda.</li>
          )}
        </ul>

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
      </Section>
    </div>
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
  onToggle,
  onRemove,
  ai,
}: {
  item: PackingItem;
  onToggle: () => void;
  onRemove: () => void;
  ai: boolean;
}) {
  return (
    <li className="flex items-center gap-sm">
      <input
        type="checkbox"
        checked={item.packed}
        onChange={onToggle}
        className="size-4 accent-flame"
      />
      <span
        className={`flex-1 text-sm ${
          item.packed ? "text-text-muted line-through" : "text-text-primary"
        }`}
      >
        {item.name}
      </span>
      {ai && <SourceBadge tone="ai" label="AI" />}
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
