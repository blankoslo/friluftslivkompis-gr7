import { Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "ai" | "data";

export function SourceBadge({
  tone,
  label,
  className,
}: {
  tone: Tone;
  label: string;
  className?: string;
}) {
  const styles =
    tone === "ai"
      ? "bg-midnight-sun-tint text-midnight-sun"
      : "bg-forest-tint text-forest";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-xs rounded-pill px-sm py-[2px] text-[10px] font-bold uppercase tracking-label",
        styles,
        className,
      )}
    >
      {tone === "ai" ? (
        <Sparkles className="h-3 w-3" aria-hidden />
      ) : null}
      {label}
    </span>
  );
}

export function AiDisclosure({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-sm rounded-md border border-midnight-sun-tint bg-midnight-sun-tint/60 px-sm py-xs text-xs text-text-primary",
        className,
      )}
    >
      <Sparkles
        className="mt-[2px] h-3 w-3 shrink-0 text-midnight-sun"
        aria-hidden
      />
      <span>{children}</span>
    </p>
  );
}

export function DataNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-sm text-xs text-text-muted",
        className,
      )}
    >
      <Info className="mt-[2px] h-3 w-3 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function reliabilityExplanation(
  reliability: "high" | "medium" | "low",
): string | null {
  if (reliability === "low") {
    return "Mer enn 9 dager unna - prognosen er et grovt anslag. Sjekk yr.no nærmere avreise.";
  }
  if (reliability === "medium") {
    return "3-9 dager unna - rimelig sikker, men kan endre seg. Sjekk på nytt før du pakker siste finish.";
  }
  return null;
}
