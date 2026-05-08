import type { Metadata } from "next";
import { Caveat, Playfair_Display, Source_Sans_3, Special_Elite } from "next/font/google";
import { LarsMonsenChat } from "@/components/lars-monsen/lars-monsen-chat";
import { SiteHeader } from "@/components/site-header";
import { ServiceWorkerRegister } from "@/components/sw-register";
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

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "På tur med Monsen",
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
      className={`${playfair.variable} ${sourceSans.variable} ${caveat.variable} ${specialElite.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <LarsMonsenChat />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
