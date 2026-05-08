"use client";

import { useState } from "react";

type Variant = "primary" | "ghost" | "white";

type Props = {
  url: string;
  title: string;
  text?: string;
  label?: string;
  copiedLabel?: string;
  variant?: Variant;
  className?: string;
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "border-2 border-flame-pressed bg-flame-primary text-white hover:bg-flame-pressed",
  ghost:
    "border-2 border-flame-pressed bg-bg text-flame-pressed hover:bg-flame-bg",
  white:
    "border-2 border-white bg-white/10 text-white backdrop-blur hover:bg-white/20",
};

function readOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function toAbsolute(url: string, origin: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (!origin) return url;
  return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
}

export function ShareButton({
  url,
  title,
  text,
  label = "Del",
  copiedLabel = "Lenke kopiert",
  variant = "ghost",
  className = "",
}: Props) {
  const [origin] = useState(readOrigin);
  const [copied, setCopied] = useState(false);
  const fullUrl = toAbsolute(url, origin);

  async function handleShare() {
    if (!origin) return;
    const shareData: ShareData = {
      title,
      text: text ?? title,
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
        // fall through to clipboard
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
      className={`inline-flex items-center gap-xs rounded-pill px-md py-xs text-small font-bold transition-colors disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
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
      {copied ? copiedLabel : label}
    </button>
  );
}
