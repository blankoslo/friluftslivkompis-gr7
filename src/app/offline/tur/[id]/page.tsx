import { notFound } from "next/navigation";
import Link from "next/link";
import { getCabin, getTrip, type Cabin } from "@/lib/ut";
import { OfflineMapLoader } from "@/components/offline/offline-map-loader";

interface OfflineTripPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 86400;

export default async function OfflineTripPage({
  params,
}: OfflineTripPageProps) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const trip = await getTrip(id);
  if (!trip) notFound();

  const cabins = (
    await Promise.all(
      trip.cabinIds.map((cid) => getCabin(cid).catch(() => null)),
    )
  ).filter((c): c is Cabin => c !== null);

  return (
    <main className="bg-bg min-h-screen">
      <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-5xl flex-col gap-md px-md py-md sm:px-lg">
        <div className="bg-flame-pressed text-white rounded-lg border-4 border-flame-pressed shadow-[6px_6px_0_var(--brand-flame-pressed)] p-md flex items-center justify-between gap-md relative">
          <span
            className="absolute -top-3 right-md bg-forest text-white text-xs font-bold px-sm py-1 rounded border-2 border-forest uppercase tracking-label"
            style={{
              fontFamily: "var(--font-stamp)",
              transform: "rotate(4deg)",
            }}
          >
            OFFLINE
          </span>
          <div>
            <Link
              href="/discover"
              className="text-small font-bold opacity-90 hover:opacity-100 underline underline-offset-4"
            >
              ← Tilbake til Discover
            </Link>
            <h1 className="mt-xs font-heading text-h2 font-black">
              {trip.name ?? "Offline-modus"}
            </h1>
          </div>
        </div>
        <div className="min-h-0 flex-1 rounded-lg border-4 border-flame-pressed shadow-[6px_6px_0_var(--brand-flame-pressed)] overflow-hidden bg-bg">
          <OfflineMapLoader trip={trip} cabins={cabins} />
        </div>
        <EmergencyQuickStrip cabins={cabins} />
      </div>
    </main>
  );
}

function EmergencyQuickStrip({ cabins }: { cabins: Cabin[] }) {
  const staffed = cabins.find(
    (c) => (c.serviceLevel ?? "").toUpperCase() === "STAFFED",
  );
  return (
    <div className="rounded-lg border-4 border-warning bg-warning-bg p-md flex flex-wrap items-center gap-md shadow-[6px_6px_0_var(--accent-warning)]">
      <span className="font-heading text-h3 font-black text-warning uppercase tracking-label">
        Nødnumre
      </span>
      <a
        href="tel:113"
        className="rounded-md border-2 border-warning bg-bg px-md py-sm font-heading text-h3 font-black text-warning"
      >
        113
      </a>
      <a
        href="tel:110"
        className="rounded-md border-2 border-warning bg-bg px-md py-sm font-heading text-h3 font-black text-warning"
      >
        110
      </a>
      <a
        href="tel:116117"
        className="rounded-md border-2 border-forest bg-bg px-md py-sm font-heading text-h3 font-black text-forest"
      >
        116117
      </a>
      {staffed?.phone && (
        <a
          href={`tel:${staffed.phone.replace(/\s+/g, "")}`}
          className="rounded-md border-2 border-fjord bg-bg px-md py-sm text-sm font-bold text-fjord"
        >
          🛖 {staffed.name}: {staffed.phone}
        </a>
      )}
    </div>
  );
}
