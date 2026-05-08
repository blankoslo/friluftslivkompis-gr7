"use client";

import { useEffect, useState } from "react";

export function InviteLink({ token }: { token: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
      <p className="text-text-muted text-small">
        Del lenken under. Ingen pålogging kreves for deltakere.
      </p>
      <div className="flex flex-col sm:flex-row gap-sm">
        <input
          readOnly
          value={fullUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-md border border-border bg-bg px-md py-sm text-small font-mono text-text-primary focus:outline-none focus:border-flame-primary"
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!origin}
          className="inline-flex h-10 items-center justify-center rounded-md bg-flame-primary px-md text-small font-medium text-white transition-colors hover:bg-flame-hover active:bg-flame-pressed disabled:opacity-50"
        >
          {copied ? "Kopiert ✓" : "Kopier lenke"}
        </button>
      </div>
    </div>
  );
}
