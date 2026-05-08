import Image from "next/image";
import { randomQuip, type QuipCategory } from "@/lib/lars-monsen/quips";

type Props = {
  category: QuipCategory;
  quip?: string;
  seed?: number;
  variant?: "compact" | "card";
  align?: "start" | "center";
};

export function MonsenLine({
  category,
  quip,
  seed,
  variant = "compact",
  align = "start",
}: Props) {
  const text = quip ?? randomQuip(category, seed);

  if (variant === "card") {
    return (
      <div
        className={`flex items-start gap-sm rounded-md border-2 border-flame-pressed bg-flame-tint px-md py-sm shadow-[2px_2px_0_var(--brand-flame-pressed)] ${
          align === "center" ? "justify-center text-center" : ""
        }`}
      >
        <div className="relative size-8 shrink-0 overflow-hidden rounded-full border-2 border-flame-pressed bg-bg">
          <Image
            src="/lars-monsen-kayak.png"
            alt="Lars Monsen"
            fill
            className="object-cover object-top"
            sizes="32px"
          />
        </div>
        <p
          className="text-sm leading-snug text-text-primary"
          style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
        >
          {text}
        </p>
      </div>
    );
  }

  return (
    <p
      className={`flex items-center gap-xs text-sm leading-snug text-text-primary ${
        align === "center" ? "justify-center text-center" : ""
      }`}
      style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
    >
      <span className="text-flame-primary">-</span>
      <span>{text}</span>
      <span className="text-text-muted text-xs">Lars</span>
    </p>
  );
}
