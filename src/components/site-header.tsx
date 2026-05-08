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
          Friluftskompis
        </Link>
        <div className="flex gap-lg text-sm font-semibold text-text-muted">
          <Link
            href="/discover"
            className="transition-colors hover:font-bold hover:text-flame-primary"
          >
            Discover
          </Link>
          <Link
            href="/tur/ny"
            className="transition-colors hover:font-bold hover:text-flame-primary"
          >
            Ny tur
          </Link>
          <Link
            href="/logg"
            className="transition-colors hover:font-bold hover:text-flame-primary"
          >
            Logg
          </Link>
        </div>
      </nav>
    </header>
  );
}
