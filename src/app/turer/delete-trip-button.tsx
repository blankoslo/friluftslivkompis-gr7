"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteTripButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-xs" onClick={(e) => e.preventDefault()}>
        <span className="text-xs text-text-muted font-semibold">Sikker?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-bold text-white bg-flame-primary px-sm py-1 rounded hover:bg-flame-hover transition-colors disabled:opacity-50"
        >
          {deleting ? "Sletter…" : "Ja, slett"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors px-xs py-1"
        >
          Avbryt
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setConfirming(true);
      }}
      className="text-xs font-bold text-flame-pressed hover:text-flame-primary transition-colors px-xs py-1"
    >
      Slett
    </button>
  );
}
