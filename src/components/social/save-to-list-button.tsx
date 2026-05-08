"use client";

import { useEffect, useState } from "react";

type SavedListSummary = {
  id: string;
  name: string;
  shareToken: string;
  itemCount: number;
};

type Item = {
  utTripId?: number;
  tripId?: string;
  title: string;
  area?: string;
  lat?: number;
  lon?: number;
  imageUrl?: string;
};

type Props = {
  item: Item;
  variant?: "primary" | "ghost";
};

export function SaveToListButton({ item, variant = "ghost" }: Props) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<SavedListSummary[] | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/lister")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setLists(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setLists([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function addToExisting(token: string) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/lister/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error();
      setFeedback("Lagt til");
      setCreatedToken(token);
    } catch {
      setFeedback("Feilet, prøv igjen");
    } finally {
      setBusy(false);
    }
  }

  async function createList() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/lister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, item }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { shareToken: string };
      setCreatedToken(data.shareToken);
      setFeedback("Liste opprettet");
      setNewName("");
    } catch {
      setFeedback("Kunne ikke opprette liste");
    } finally {
      setBusy(false);
    }
  }

  const baseClass =
    variant === "primary"
      ? "border-2 border-flame-pressed bg-flame-primary text-white hover:bg-flame-pressed"
      : "border-2 border-flame-pressed bg-bg text-flame-pressed hover:bg-flame-bg";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-xs rounded-pill px-md py-xs text-small font-bold transition-colors ${baseClass}`}
        style={{ fontFamily: "var(--font-stamp)", letterSpacing: "0.04em" }}
      >
        <span aria-hidden>🔖</span>
        {open ? "Lukk" : "Lagre i liste"}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-xs w-[20rem] rounded-md border-2 border-flame-pressed bg-bg p-md text-text-primary shadow-[6px_6px_0_var(--brand-flame-pressed)]">
          <p className="font-heading text-sm font-bold mb-xs">
            Lagre &ldquo;{item.title}&rdquo; i:
          </p>
          {lists === null ? (
            <p className="text-xs text-text-muted">Henter lister...</p>
          ) : lists.length === 0 ? (
            <p className="text-xs text-text-muted">Ingen lister enda.</p>
          ) : (
            <ul className="max-h-40 overflow-auto flex flex-col gap-xs mb-sm">
              {lists.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => addToExisting(l.shareToken)}
                    className="w-full text-left rounded border border-flame-pressed/40 px-sm py-xs text-sm hover:bg-flame-bg disabled:opacity-50"
                  >
                    <span className="font-bold">{l.name}</span>{" "}
                    <span className="text-xs text-text-muted">
                      ({l.itemCount})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-flame-pressed/30 pt-sm">
            <p className="text-xs text-text-muted mb-xs">
              Eller lag ny liste:
            </p>
            <div className="flex gap-xs">
              <input
                type="text"
                placeholder="Sommerplaner"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 rounded border border-flame-pressed/40 bg-bg px-sm py-xs text-sm"
              />
              <button
                type="button"
                onClick={createList}
                disabled={busy || !newName.trim()}
                className="rounded bg-flame-primary px-sm py-xs text-xs font-bold text-white disabled:opacity-50"
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                Opprett
              </button>
            </div>
          </div>
          {feedback && (
            <p className="mt-xs text-xs text-forest font-bold">{feedback}</p>
          )}
          {createdToken && (
            <a
              href={`/lister/${createdToken}`}
              className="mt-xs inline-block text-xs font-bold text-fjord underline"
            >
              Åpne lista →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
