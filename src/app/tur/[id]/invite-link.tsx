"use client";

import { useState } from "react";

function readOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function InviteLink({ token }: { token: string }) {
  const [origin] = useState(readOrigin);
  const [copied, setCopied] = useState(false);

  const path = `/inviter/${token}`;
  const fullUrl = origin ? `${origin}${path}` : path;

  async function handleCopy() {
    if (!origin) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-sm">
      <p
        className="text-text-primary text-lg leading-snug"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        Del lenken under. Ingen pålogging kreves for deltakere.
      </p>
      <div className="flex flex-col sm:flex-row gap-sm">
        <input
          readOnly
          value={fullUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-md border-2 border-flame-pressed bg-bg px-md py-sm text-small font-mono font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-flame-primary"
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!origin}
          className="inline-flex h-10 items-center justify-center rounded-md bg-flame-primary px-md text-small font-bold text-white shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:bg-flame-hover hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-all disabled:opacity-50"
        >
          {copied ? "Kopiert ✓" : "Kopier lenke"}
        </button>
      </div>
    </div>
  );
}
