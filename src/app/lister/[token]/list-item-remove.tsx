"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
  itemId: string;
};

export function SavedListItemRemove({ token, itemId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (busy) return;
    if (!confirm("Fjerne fra lista?")) return;
    setBusy(true);
    try {
      await fetch(
        `/api/lister/${token}?itemId=${encodeURIComponent(itemId)}`,
        { method: "DELETE" },
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="text-xs text-text-muted hover:text-flame-pressed disabled:opacity-50"
      aria-label="Fjern fra liste"
    >
      ✕
    </button>
  );
}
