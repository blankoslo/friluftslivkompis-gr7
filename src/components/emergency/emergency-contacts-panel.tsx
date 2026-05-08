"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MonsenToast } from "@/components/lars-monsen/monsen-toast";
import { APP_CACHE, DATA_CACHE } from "@/lib/offline/cache";

export type EmergencyRole =
  | "turleder"
  | "pårørende"
  | "fastlege"
  | "forsikring"
  | "annet";

export interface EmergencyContact {
  _id?: string;
  name: string;
  phone: string;
  role: EmergencyRole;
  note?: string;
}

interface Props {
  tripId: string;
  initialContacts: EmergencyContact[];
}

const ROLE_LABEL: Record<EmergencyRole, string> = {
  turleder: "Turleder",
  pårørende: "Pårørende",
  fastlege: "Fastlege",
  forsikring: "Forsikring",
  annet: "Annet",
};

const ROLE_TONE: Record<EmergencyRole, string> = {
  turleder: "bg-flame-tint text-flame",
  pårørende: "bg-forest-tint text-forest",
  fastlege: "bg-fjord-tint text-fjord",
  forsikring: "bg-bg-secondary text-text-muted",
  annet: "bg-bg-secondary text-text-muted",
};

export function EmergencyContactsPanel({ tripId, initialContacts }: Props) {
  const [contacts, setContacts] = useState<EmergencyContact[]>(initialContacts);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftRole, setDraftRole] = useState<EmergencyRole>("pårørende");
  const [draftNote, setDraftNote] = useState("");
  const [, startSaving] = useTransition();
  const [toast, setToast] = useState<{ trigger: number; quip: string } | null>(
    null,
  );

  function fireToast(quip: string) {
    setToast({ trigger: Date.now(), quip });
  }

  function persist(next: EmergencyContact[]) {
    setContacts(next);
    startSaving(async () => {
      await fetch(`/api/trips/${tripId}/emergency`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: next }),
      }).catch(() => {});
    });
  }

  function addContact(e: React.FormEvent) {
    e.preventDefault();
    const name = draftName.trim();
    const phone = draftPhone.trim();
    if (!name || !phone) return;
    const next: EmergencyContact = {
      name,
      phone,
      role: draftRole,
      note: draftNote.trim() || undefined,
    };
    persist([...contacts, next]);
    setDraftName("");
    setDraftPhone("");
    setDraftRole("pårørende");
    setDraftNote("");
    fireToast("Lagt til. Forhåpentligvis ringer du aldri.");
  }

  function remove(target: EmergencyContact) {
    persist(contacts.filter((c) => c !== target));
  }

  const [cacheState, setCacheState] = useState<
    "idle" | "warming" | "done" | "error"
  >("idle");

  async function warmOfflineCache() {
    if (typeof window === "undefined" || !("caches" in window)) {
      setCacheState("error");
      return;
    }
    setCacheState("warming");
    try {
      const appCache = await caches.open(APP_CACHE);
      await appCache.add(`/tur/${tripId}/nodinfo`);
      const dataCache = await caches.open(DATA_CACHE);
      await dataCache.add(`/api/trips/${tripId}`);
      setCacheState("done");
    } catch (e) {
      console.warn("[emergency] cache warm failed", e);
      setCacheState("error");
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <p className="text-sm text-text-muted">
          Disse vises også offline på{" "}
          <Link
            href={`/tur/${tripId}/nodinfo`}
            className="font-bold text-fjord underline underline-offset-2"
          >
            nødinfo-siden
          </Link>
          . Trykk på et nummer for å ringe.
        </p>
        <button
          type="button"
          onClick={warmOfflineCache}
          disabled={cacheState === "warming"}
          className="rounded-md border-2 border-fjord bg-bg px-sm py-xs text-xs font-bold text-fjord disabled:opacity-60"
        >
          {cacheState === "idle" && "Lagre offline"}
          {cacheState === "warming" && "Lagrer..."}
          {cacheState === "done" && "✓ Lagret offline"}
          {cacheState === "error" && "Feilet, prøv igjen"}
        </button>
      </div>

      <ul className="flex flex-col gap-xs">
        {contacts.map((c, idx) => (
          <li
            key={c._id ?? idx}
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
              className="font-mono text-sm font-bold text-fjord underline underline-offset-2"
            >
              {c.phone}
            </a>
            {c.note && (
              <span className="flex-1 min-w-[160px] text-xs text-text-muted">
                {c.note}
              </span>
            )}
            <button
              onClick={() => remove(c)}
              className="text-text-muted hover:text-warning text-xs"
              aria-label="Fjern"
            >
              ×
            </button>
          </li>
        ))}
        {contacts.length === 0 && (
          <li className="text-sm text-text-muted">
            Ingen kontakter lagt til. Legg til turleder, pårørende eller
            forsikring under.
          </li>
        )}
      </ul>

      <MonsenToast trigger={toast?.trigger ?? null} quip={toast?.quip ?? null} />

      <form
        onSubmit={addContact}
        className="grid gap-sm rounded-md border border-border bg-bg-secondary p-sm sm:grid-cols-[1fr_1fr_auto_auto]"
      >
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Navn"
          className="rounded-md border border-border bg-bg px-sm py-xs text-sm text-text-primary"
          required
        />
        <input
          type="tel"
          inputMode="tel"
          value={draftPhone}
          onChange={(e) => setDraftPhone(e.target.value)}
          placeholder="Telefon"
          className="rounded-md border border-border bg-bg px-sm py-xs text-sm text-text-primary"
          required
        />
        <select
          value={draftRole}
          onChange={(e) => setDraftRole(e.target.value as EmergencyRole)}
          className="rounded-md border border-border bg-bg px-sm py-xs text-sm text-text-primary"
        >
          <option value="turleder">Turleder</option>
          <option value="pårørende">Pårørende</option>
          <option value="fastlege">Fastlege</option>
          <option value="forsikring">Forsikring</option>
          <option value="annet">Annet</option>
        </select>
        <Button type="submit" variant="outline" size="sm">
          Legg til
        </Button>
        <input
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
          placeholder="Notat (valgfritt) - eks. polisenr, åpningstid"
          className="rounded-md border border-border bg-bg px-sm py-xs text-sm text-text-primary sm:col-span-4"
        />
      </form>
    </div>
  );
}
