"use client";

import { useEffect, useState } from "react";
import { MonsenToast } from "./monsen-toast";

const KEY = "monsenToast";

export function MonsenSessionToast() {
  const [data, setData] = useState<{ trigger: number; quip: string } | null>(
    null,
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return;
      sessionStorage.removeItem(KEY);
      const parsed = JSON.parse(raw) as { quip?: string; at?: number };
      if (!parsed.quip) return;
      if (parsed.at && Date.now() - parsed.at > 30_000) return;
      setData({ trigger: Date.now(), quip: parsed.quip });
    } catch {}
  }, []);

  return <MonsenToast trigger={data?.trigger ?? null} quip={data?.quip ?? null} />;
}
