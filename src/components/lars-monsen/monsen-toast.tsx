"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  trigger: number | string | null;
  quip: string | null;
  durationMs?: number;
};

export function MonsenToast({ trigger, quip, durationMs = 5500 }: Props) {
  if (trigger === null || !quip) return null;
  return (
    <ToastBody key={String(trigger)} quip={quip} durationMs={durationMs} />
  );
}

function ToastBody({ quip, durationMs }: { quip: string; durationMs: number }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHidden(true), durationMs);
    return () => clearTimeout(t);
  }, [durationMs]);

  if (hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-40 max-w-[420px] flex items-end gap-md pointer-events-none animate-monsen-pop"
    >
      <div
        className="relative rounded-xl rounded-br-sm bg-bg border-2 border-flame-pressed px-lg py-md text-xl leading-snug text-text-primary shadow-[4px_4px_0_var(--brand-flame-pressed)]"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
      >
        {quip}
        <span className="absolute top-1/2 -right-[12px] -translate-y-1/2 h-0 w-0 border-t-[10px] border-b-[10px] border-l-[12px] border-t-transparent border-b-transparent border-l-flame-pressed" />
        <span className="absolute top-1/2 -right-[9px] -translate-y-1/2 h-0 w-0 border-t-[8px] border-b-[8px] border-l-[10px] border-t-transparent border-b-transparent border-l-bg" />
      </div>
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-flame-pressed shadow-[3px_3px_0_var(--brand-flame-pressed)] bg-bg">
        <Image
          src="/lars-monsen-kayak.png"
          alt="Lars Monsen"
          fill
          className="object-cover object-top"
          sizes="80px"
        />
      </div>
    </div>
  );
}
