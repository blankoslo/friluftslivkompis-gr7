"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 border-b-2 border-flame-pressed bg-bg/90 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-lg h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-heading font-bold text-xl text-flame-pressed tracking-tight transition-colors hover:text-flame-primary"
        >
          På tur med Monsen
        </Link>
        <div className="flex gap-lg text-sm font-semibold text-text-muted">
          {[
            { href: "/discover", label: "Utforsk" },
            { href: "/tur/ny", label: "Ny tur" },
            { href: "/turer", label: "Turer" },
          ].map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={
                  isActive
                    ? "text-flame-primary font-bold border-b-2 border-flame-primary pb-0.5"
                    : "transition-colors hover:font-bold hover:text-flame-primary"
                }
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
