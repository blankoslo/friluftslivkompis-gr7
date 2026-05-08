import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Friluftskompis",
  description: "Planlegg fjellturen på ett sted",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="no"
      className={`${playfair.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
          <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="font-heading font-bold text-xl tracking-tight hover:text-flame transition-colors"
            >
              Friluftskompis
            </Link>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/discover" className="hover:text-flame transition-colors">
                Discover
              </Link>
              <Link href="/tur/ny" className="hover:text-flame transition-colors">
                Ny tur
              </Link>
              <Link href="/logg" className="hover:text-flame transition-colors">
                Logg
              </Link>
            </div>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
