"use client";

import { useState } from "react";
import { randomQuip } from "@/lib/lars-monsen/quips";

type Props = {
  token: string;
  title: string;
};

function readOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function ShareButton({ token, title }: Props) {
  const [origin] = useState(readOrigin);
  const [copied, setCopied] = useState(false);
  const [quip] = useState(() => randomQuip("inviteShare"));

  const path = `/inviter/${token}`;
  const fullUrl = origin ? `${origin}${path}` : path;

  async function handleShare() {
    if (!origin) return;
    const shareData = {
      title: `Bli med på ${title}`,
      text: `${quip} - Lars`,
      url: fullUrl,
    };
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share(shareData);
        return;
      } catch {
        // user cancelled or share failed - fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={!origin}
      className="inline-flex items-center gap-xs rounded-pill border-2 border-white bg-white/10 px-md py-xs text-small font-bold text-white backdrop-blur transition-colors hover:bg-white/20 disabled:opacity-50"
      style={{ fontFamily: "var(--font-stamp)", letterSpacing: "0.04em" }}
    >
      <svg
        aria-hidden
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {copied ? "Lenke kopiert" : "Del invitasjon"}
    </button>
  );
}
