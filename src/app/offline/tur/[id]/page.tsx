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
      </div>
    </main>
  );
}
