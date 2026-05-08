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
      className="fixed bottom-6 left-6 z-40 max-w-[280px] flex items-end gap-sm pointer-events-none"
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-full border-2 border-flame-pressed shadow-[2px_2px_0_var(--brand-flame-pressed)] bg-bg">
        <Image
          src="/lars-monsen.jpg"
          alt="Lars Monsen"
          fill
          className="object-cover object-[center_20%]"
          sizes="40px"
        />
      </div>
      <div
        className="relative rounded-lg rounded-bl-sm bg-bg border-2 border-flame-pressed px-md py-sm text-base leading-snug text-text-primary shadow-[3px_3px_0_var(--brand-flame-pressed)]"
        style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
      >
        {quip}
        <span className="absolute -bottom-[10px] left-3 h-0 w-0 border-l-[4px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-flame-pressed" />
      </div>
    </div>
  );
}
