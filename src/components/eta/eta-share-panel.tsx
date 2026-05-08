"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MonsenToast } from "@/components/lars-monsen/monsen-toast";
import { randomQuip } from "@/lib/lars-monsen/quips";

export interface EtaShareView {
  token: string;
  enabled: boolean;
  contactName: string;
  contactPhone?: string;
  expectedReturnAt: string;
  createdAt: string;
  completedAt: string | null;
  url?: string;
  path?: string;
}

interface Props {
  tripId: string;
  tripTitle: string;
  defaultExpectedReturnAt?: string;
  initialEtaShare: EtaShareView | null;
}

function toLocalInputValue(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("nb-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function EtaSharePanel({
  tripId,
  tripTitle,
  defaultExpectedReturnAt,
  initialEtaShare,
}: Props) {
  const [share, setShare] = useState<EtaShareView | null>(initialEtaShare);
  const [contactName, setContactName] = useState(
    initialEtaShare?.contactName ?? "",
  );
  const [contactPhone, setContactPhone] = useState(
    initialEtaShare?.contactPhone ?? "",
  );
  const [expectedLocal, setExpectedLocal] = useState(
    toLocalInputValue(
      initialEtaShare?.expectedReturnAt ?? defaultExpectedReturnAt,
    ),
  );
  const [origin] = useState(readOrigin);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ trigger: number; quip: string } | null>(
    null,
  );

  function fireToast(quip: string) {
    setToast((prev) => ({ trigger: (prev?.trigger ?? 0) + 1, quip }));
  }

  const fullUrl = useMemo(() => {
    if (!share) return "";
    if (share.url) return share.url;
    if (origin) return `${origin}${share.path ?? `/eta/${share.token}`}`;
    return `/eta/${share.token}`;
  }, [share, origin]);

  const smsBody = useMemo(() => {
    if (!share) return "";
    const expected = formatDateTime(share.expectedReturnAt);
    return `Hei ${share.contactName}! Jeg er på solotur (${tripTitle}). Forventet hjemkomst ${expected}. Følg statusen min her: ${fullUrl}`;
  }, [share, fullUrl, tripTitle]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = contactName.trim();
    const phone = contactPhone.trim();
    const expectedISO = fromLocalInputValue(expectedLocal);
    if (!name) {
      setError("Skriv inn navn på kontaktpersonen.");
      return;
    }
    if (!expectedISO) {
      setError("Velg et gyldig tidspunkt for forventet hjemkomst.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/eta-share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactName: name,
            contactPhone: phone || undefined,
            expectedReturnAt: expectedISO,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? "Klarte ikke å lagre ETA-deling");
        }
        const data = (await res.json()) as EtaShareView;
        setShare(data);
        fireToast(randomQuip("etaShare"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ukjent feil");
      }
    });
  }

  async function handleCopy() {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  async function handleWebShare() {
    if (!share || !fullUrl) return;
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    if (!nav.share) {
      handleCopy();
      return;
    }
    try {
      await nav.share({
        title: `ETA for ${tripTitle}`,
        text: smsBody,
        url: fullUrl,
      });
    } catch {
      // user cancelled
    }
  }

  function handleStop() {
    if (!share) return;
    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripId}/eta-share`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShare(null);
        setCopied(false);
        fireToast("ETA-deling stoppet. Hils kontakten din god natt.");
      }
    });
  }

  function handleMarkHome() {
    if (!share) return;
    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripId}/eta-share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      if (res.ok) {
        const data = (await res.json()) as EtaShareView;
        setShare(data);
        fireToast("Hjemme. Da slipper kontakten å bekymre seg.");
      }
    });
  }

  if (share && share.enabled) {
    const isHome = !!share.completedAt;
    const phoneForSms = share.contactPhone ?? "";
    const smsHref = `sms:${phoneForSms}?&body=${encodeURIComponent(smsBody)}`;

    return (
      <div className="flex flex-col gap-md">
        <div className="rounded-md border-2 border-forest bg-forest-tint p-md">
          <p className="text-xs font-bold uppercase tracking-label text-forest">
            ETA-deling aktiv
          </p>
          <p className="mt-xs font-heading text-h3 font-bold text-text-primary">
            {share.contactName}
          </p>
          {share.contactPhone && (
            <p className="text-sm text-text-muted">
              <a
                href={`tel:${share.contactPhone}`}
                className="font-mono font-bold text-fjord underline underline-offset-2"
              >
                {share.contactPhone}
              </a>
            </p>
          )}
          <dl className="mt-sm grid grid-cols-1 gap-xs text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-label text-text-muted">
                Forventet hjem
              </dt>
              <dd className="font-bold text-text-primary">
                {formatDateTime(share.expectedReturnAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-label text-text-muted">
                Aktiv siden
              </dt>
              <dd className="font-bold text-text-primary">
                {formatDateTime(share.createdAt)}
              </dd>
            </div>
          </dl>
          {isHome && (
            <p className="mt-sm rounded-md bg-bg px-sm py-xs text-sm font-bold text-forest">
              Markert som hjemme {formatDateTime(share.completedAt!)}.
            </p>
          )}
        </div>

        <div className="rounded-md border border-border bg-bg-secondary p-sm">
          <p className="text-xs uppercase tracking-label text-text-muted">
            Delelink
          </p>
          <p className="mt-xs break-all font-mono text-sm text-fjord">
            {fullUrl}
          </p>
        </div>

        <div className="flex flex-wrap gap-sm">
          <Button
            type="button"
            onClick={handleCopy}
            variant="outline"
            size="sm"
          >
            {copied ? "Lenke kopiert" : "Kopier lenke"}
          </Button>
          <a
            href={smsHref}
            className="inline-flex items-center gap-xs rounded-md border-2 border-flame-pressed bg-flame-primary px-md py-xs text-sm font-bold text-white shadow-[3px_3px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--brand-flame-pressed)] transition-transform"
          >
            Send via SMS
          </a>
          <Button
            type="button"
            onClick={handleWebShare}
            variant="outline"
            size="sm"
          >
            Del...
          </Button>
          {!isHome && (
            <Button
              type="button"
              onClick={handleMarkHome}
              variant="outline"
              size="sm"
              disabled={pending}
            >
              Marker som hjemme
            </Button>
          )}
          <Button
            type="button"
            onClick={handleStop}
            variant="destructive"
            size="sm"
            disabled={pending}
          >
            Stopp deling
          </Button>
        </div>

        <MonsenToast
          trigger={toast?.trigger ?? null}
          quip={toast?.quip ?? null}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-md">
      <p className="text-sm text-text-muted">
        For soloturer: del forventet hjemkomst med en kontaktperson, slik at noen
        hjemme vet når de skal forvente deg tilbake.
      </p>
      <div className="grid gap-sm sm:grid-cols-2">
        <label className="flex flex-col gap-xs text-sm">
          <span className="text-xs uppercase tracking-label text-text-muted">
            Kontaktnavn
          </span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="F.eks. Ingrid"
            className="rounded-md border border-border bg-bg px-sm py-xs text-text-primary"
            required
          />
        </label>
        <label className="flex flex-col gap-xs text-sm">
          <span className="text-xs uppercase tracking-label text-text-muted">
            Telefon (valgfritt)
          </span>
          <input
            type="tel"
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+47 ..."
            className="rounded-md border border-border bg-bg px-sm py-xs text-text-primary"
          />
        </label>
        <label className="flex flex-col gap-xs text-sm sm:col-span-2">
          <span className="text-xs uppercase tracking-label text-text-muted">
            Forventet hjemkomst
          </span>
          <input
            type="datetime-local"
            value={expectedLocal}
            onChange={(e) => setExpectedLocal(e.target.value)}
            className="rounded-md border border-border bg-bg px-sm py-xs text-text-primary"
            required
          />
        </label>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-md border-2 border-warning bg-warning-bg px-sm py-xs text-sm font-bold text-warning"
        >
          {error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Lager link..." : "Lag delelink"}
        </Button>
      </div>
      <MonsenToast
        trigger={toast?.trigger ?? null}
        quip={toast?.quip ?? null}
      />
    </form>
  );
}
