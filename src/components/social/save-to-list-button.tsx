"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

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

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const width = 320;
      const left = Math.min(
        Math.max(8, r.right - width),
        window.innerWidth - width - 8,
      );
      setPos({ top: r.bottom + 6, left });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
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

  const popover = open && pos && (
    <div
      ref={popRef}
      className="fixed z-50 w-[20rem] rounded-md border-2 border-flame-pressed bg-bg p-md text-text-primary shadow-[6px_6px_0_var(--brand-flame-pressed)]"
      style={{ top: pos.top, left: pos.left }}
    >
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
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-xs rounded-pill px-md py-xs text-small font-bold transition-colors ${baseClass}`}
        style={{ fontFamily: "var(--font-stamp)", letterSpacing: "0.04em" }}
      >
        <span aria-hidden>🔖</span>
        {open ? "Lukk" : "Lagre i liste"}
      </button>
      {mounted && popover ? createPortal(popover, document.body) : null}
    </>
  );
}
