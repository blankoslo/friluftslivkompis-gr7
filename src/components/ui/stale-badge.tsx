import { cn } from "@/lib/utils";

type Props = {
  snapshotAt?: string | null;
  className?: string;
  compact?: boolean;
};

function formatRelative(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days <= 0) return "i dag";
  if (days === 1) return "1 dag siden";
  if (days < 30) return `${days} dager siden`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 måned siden" : `${months} måneder siden`;
}

export function StaleBadge({ snapshotAt, className, compact }: Props) {
  const rel = formatRelative(snapshotAt);
  const label = compact
    ? "Snapshot"
    : `Snapshot${rel ? ` · ${rel}` : ""} · kan være utdatert`;

  return (
    <span
      role="status"
      aria-label="Data fra forhåndslastet snapshot, kan være utdatert"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-warning-border bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning tracking-label",
        className,
      )}
      title={
        snapshotAt
          ? `DNT-API utilgjengelig. Viser snapshot fra ${new Date(snapshotAt).toLocaleDateString("nb-NO")}.`
          : "DNT-API utilgjengelig. Viser snapshot."
      }
    >
      <span aria-hidden="true">⚠</span>
      {label}
    </span>
  );
}
