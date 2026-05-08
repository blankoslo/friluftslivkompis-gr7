"use client";

import { useEffect, useState } from "react";

export interface TripSideNavItem {
  id: string;
  label: string;
}

export function TripSideNav({ items }: { items: TripSideNavItem[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  const activeLabel =
    items.find((i) => i.id === active)?.label ?? items[0]?.label ?? "";

  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 -mx-md mb-md bg-bg/95 backdrop-blur border-b-2 border-flame-pressed px-md py-sm">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-sm text-sm font-bold text-flame-pressed uppercase tracking-label"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          <span className="truncate">Innhold: {activeLabel}</span>
          <span aria-hidden>{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <ul className="mt-sm flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-sm py-1 text-sm font-medium ${
                    active === item.id
                      ? "bg-flame-primary text-white"
                      : "text-text-primary hover:bg-flame-tint"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <nav
        aria-label="Tursnarveier"
        className="hidden lg:block lg:sticky lg:top-md lg:w-56 lg:shrink-0 lg:self-start bg-bg border-4 border-flame-pressed rounded-lg shadow-[6px_6px_0_var(--brand-flame-pressed)] p-md"
      >
        <p
          className="text-xs font-bold uppercase tracking-label text-flame-pressed mb-sm"
          style={{ fontFamily: "var(--font-stamp)" }}
        >
          Innhold
        </p>
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block rounded-md px-sm py-1 text-sm font-medium border-2 transition-all ${
                  active === item.id
                    ? "bg-flame-primary text-white border-flame-pressed"
                    : "border-transparent text-text-primary hover:border-flame-pressed/40 hover:bg-flame-tint"
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
