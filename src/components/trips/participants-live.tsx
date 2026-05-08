"use client";

import { useEffect, useRef, useState } from "react";
import { randomQuip } from "@/lib/lars-monsen/quips";

export type ParticipantStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "pending";

export type LiveParticipant = {
  name: string;
  status: ParticipantStatus;
};

const STATUS_MAP: Record<
  ParticipantStatus,
  { label: string; className: string }
> = {
  accepted: {
    label: "Bekreftet",
    className: "bg-forest text-white",
  },
  invited: {
    label: "Invitert",
    className: "bg-fjord text-white",
  },
  pending: {
    label: "Venter",
    className: "bg-midnight-sun text-text-primary",
  },
  declined: {
    label: "Avslått",
    className: "bg-flame-hover text-white",
  },
};

const POLL_MS = 8000;

type Props = {
  tripIdOrToken: string;
  initialParticipants: LiveParticipant[];
  variant?: "tur" | "inviter";
};

export function ParticipantsLive({
  tripIdOrToken,
  initialParticipants,
  variant = "tur",
}: Props) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [hasUpdated, setHasUpdated] = useState(false);
  const lastSerialized = useRef(JSON.stringify(initialParticipants));

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function fetchOnce() {
      try {
        const res = await fetch(`/api/trips/${tripIdOrToken}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          participants?: LiveParticipant[];
        };
        if (cancelled) return;
        const next = (data.participants ?? []).map((p) => ({
          name: p.name,
          status: p.status,
        }));
        const serialized = JSON.stringify(next);
        if (serialized !== lastSerialized.current) {
          lastSerialized.current = serialized;
          setParticipants(next);
          setHasUpdated(true);
        }
      } catch {
        // ignore network blips
      }
    }

    function schedule() {
      timer = setTimeout(async () => {
        await fetchOnce();
        if (!cancelled) schedule();
      }, POLL_MS);
    }

    function onVisibility() {
      if (document.visibilityState === "visible") fetchOnce();
    }

    schedule();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tripIdOrToken]);

  const acceptedCount = participants.filter(
    (p) => p.status === "accepted",
  ).length;

  if (participants.length === 0) {
    return (
      <p
        className="text-text-primary text-lg leading-snug"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        {variant === "inviter"
          ? "Ingen har takka ja enda - bli den første!"
          : `${randomQuip("noParticipants")} Del invitasjonslenken ovenfor.`}
      </p>
    );
  }

  return (
    <div className="space-y-sm">
      {variant === "tur" && (
        <p className="text-small text-text-muted font-semibold">
          {acceptedCount} av {participants.length} har sagt ja
          {hasUpdated ? " (oppdatert nå)" : ""}
        </p>
      )}
      <ul
        className={
          variant === "inviter" ? "space-y-sm" : "grid gap-sm"
        }
      >
        {participants.map((p, i) => (
          <li
            key={`${p.name}-${i}`}
            className={
              variant === "inviter"
                ? "flex items-center justify-between rounded-md border-2 border-flame-pressed bg-flame-tint px-md py-sm shadow-[2px_2px_0_var(--brand-flame-pressed)]"
                : "flex items-center justify-between rounded-md border-2 border-flame-pressed bg-bg px-md py-sm shadow-[2px_2px_0_var(--brand-flame-pressed)]"
            }
          >
            <span className="text-text-primary font-semibold">{p.name}</span>
            <StatusBadge status={p.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: ParticipantStatus }) {
  const { label, className } = STATUS_MAP[status];
  return (
    <span
      className={`text-xs font-bold px-sm py-1 rounded-pill uppercase tracking-label ${className}`}
      style={{ fontFamily: "var(--font-stamp)" }}
    >
      {label}
    </span>
  );
}
