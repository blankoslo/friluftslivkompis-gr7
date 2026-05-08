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
    <main className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-6xl flex-col gap-md p-md">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/discover"
            className="text-small text-fjord hover:underline"
          >
            ← Tilbake til Discover
          </Link>
          <h1 className="mt-xs font-heading text-h2 font-bold text-text-primary">
            Offline-modus
          </h1>
        </div>
        <span className="rounded-pill bg-fjord-tint px-md py-xs text-small font-medium tracking-label text-fjord">
          T1
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <OfflineMapLoader trip={trip} cabins={cabins} />
      </div>
    </main>
  );
}
