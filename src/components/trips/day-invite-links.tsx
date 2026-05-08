"use client";

import { useState } from "react";
import type { CabinPoint } from "@/lib/route";

interface DayInviteLinksProps {
  inviteToken: string;
  cabins: CabinPoint[];
}

export function DayInviteLinks({ inviteToken, cabins }: DayInviteLinksProps) {
  const [copied, setCopied] = useState<number | null>(null);

  if (cabins.length < 2) return null;

  const legs = cabins.slice(0, -1).map((from, i) => ({
    dayNumber: i + 1,
    from: from.name,
    to: cabins[i + 1].name,
  }));

  function copyLink(dayNumber: number) {
    const url = `${window.location.origin}/inviter/${inviteToken}/dag/${dayNumber}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(dayNumber);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-sm">
      <p className="text-body text-text-muted">
        Kopier en dag-lenke og send til noen som bare kan bli med på én etappe.
      </p>
      <ul className="flex flex-col gap-sm">
        {legs.map(({ dayNumber, from, to }) => (
          <li
            key={dayNumber}
            className="flex items-center justify-between gap-md rounded-md border-2 border-flame-pressed bg-bg px-md py-sm shadow-[3px_3px_0_var(--brand-flame-pressed)]"
          >
            <div className="flex flex-col gap-xs min-w-0">
              <span
                className="text-small font-bold uppercase tracking-label text-flame-pressed"
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                Dag {dayNumber}
              </span>
              <span className="text-body font-semibold text-text-primary truncate">
                {from} → {to}
              </span>
            </div>
            <button
              onClick={() => copyLink(dayNumber)}
              className="shrink-0 inline-flex h-9 items-center gap-xs rounded-md border-2 border-flame-pressed bg-bg px-sm text-small font-bold text-flame-pressed hover:bg-flame-primary hover:text-white hover:border-flame-primary transition-colors"
            >
              {copied === dayNumber ? "Kopiert!" : "Kopier lenke"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
