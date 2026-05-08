import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SavedList, type ISavedListItem } from "@/models/SavedList";
import { ShareButton } from "@/components/social/share-button";
import { getSiteUrl } from "@/lib/site";
import { SavedListItemRemove } from "./list-item-remove";

interface Props {
  params: Promise<{ token: string }>;
}

interface ListView {
  id: string;
  name: string;
  description: string;
  shareToken: string;
  ownerName: string;
  items: Array<{
    id: string;
    utTripId?: number;
    title: string;
    area?: string;
    note?: string;
    lat?: number;
    lon?: number;
    addedAt?: Date;
  }>;
  createdAt?: Date;
}

async function load(token: string): Promise<ListView | null> {
  await connectToDatabase();
  const doc = await SavedList.findOne({ shareToken: token }).lean<{
    _id: unknown;
    name: string;
    description?: string;
    shareToken: string;
    ownerName?: string;
    items: ISavedListItem[];
    createdAt?: Date;
  } | null>();
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description ?? "",
    shareToken: doc.shareToken,
    ownerName: doc.ownerName ?? "",
    items: (doc.items ?? []).map((it) => ({
      id: String(it._id ?? ""),
      utTripId: it.utTripId,
      title: it.title,
      area: it.area,
      note: it.note,
      lat: it.lat,
      lon: it.lon,
      addedAt: it.addedAt,
    })),
    createdAt: doc.createdAt,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const list = await load(token);
  if (!list) {
    return {
      metadataBase: new URL(getSiteUrl()),
      title: "Turliste ikke funnet - På tur med Monsen",
      description:
        "Denne turlista finnes ikke. Lag din egen samling av drømmeturer på Friluftskompis.",
    };
  }
  const ogImage = `/api/og/liste/${token}`;
  const count = list.items.length;
  const titleParts = [list.name];
  if (list.ownerName) titleParts.push(`fra ${list.ownerName}`);
  const fullTitle = `${titleParts.join(" - ")} | Turliste på På tur med Monsen`;

  const descParts: string[] = [];
  if (list.description) descParts.push(list.description);
  descParts.push(
    `${count} ${count === 1 ? "kuratert tur" : "kuraterte turer"} i Norge${list.ownerName ? `, samlet av ${list.ownerName}` : ""}.`,
  );
  const previewTitles = list.items.slice(0, 3).map((i) => i.title);
  if (previewTitles.length > 0) {
    descParts.push(`Inkluderer: ${previewTitles.join(", ")}.`);
  }
  descParts.push("Bla, lagre dine egne, og planlegg neste tur.");
  const description = descParts.join(" ");

  return {
    metadataBase: new URL(getSiteUrl()),
    title: fullTitle,
    description,
    alternates: { canonical: `/lister/${token}` },
    openGraph: {
      type: "website",
      url: `/lister/${token}`,
      siteName: "På tur med Monsen",
      title: fullTitle,
      description,
      locale: "nb_NO",
      images: [{ url: ogImage, width: 1200, height: 630, alt: list.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

export default async function ListPage({ params }: Props) {
  const { token } = await params;
  const list = await load(token);
  if (!list) notFound();

  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-[42rem] mx-auto px-md py-lg sm:px-lg sm:py-xl">
        <div className="mb-lg flex flex-wrap items-start justify-between gap-md">
          <div>
            <p
              className="text-small font-bold uppercase tracking-label text-text-muted"
              style={{ fontFamily: "var(--font-stamp)" }}
            >
              Turliste {list.ownerName ? `· ${list.ownerName}` : ""}
            </p>
            <h1 className="font-heading text-h1 font-black text-text-primary mt-xs">
              {list.name}
            </h1>
            {list.description && (
              <p className="text-body text-text-muted mt-xs">
                {list.description}
              </p>
            )}
          </div>
          <ShareButton
            url={`/lister/${token}`}
            title={`Turliste: ${list.name}`}
            text={`${list.items.length} turer på lista. Sjekk ut.`}
            label="Del lista"
            variant="ghost"
          />
        </div>

        <p
          className="text-base mb-md text-text-primary"
          style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
        >
          &ldquo;Send lista. Den som ikke har lister, ender opp i
          kjøpesenter.&rdquo; - Lars
        </p>

        {list.items.length === 0 ? (
          <p
            className="text-text-primary text-lg leading-snug"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            Tom liste enda. Legg til noen turer du har lyst å gå.
          </p>
        ) : (
          <ul className="flex flex-col gap-md">
            {list.items.map((it) => (
              <li
                key={it.id}
                className="bg-bg border-2 border-flame-pressed rounded-md p-md shadow-[3px_3px_0_var(--brand-flame-pressed)]"
              >
                <div className="flex justify-between gap-sm items-start">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading text-h3 font-bold text-flame-pressed">
                      {it.title}
                    </h2>
                    {it.area && (
                      <p className="text-sm text-text-muted">{it.area}</p>
                    )}
                    {it.note && (
                      <p className="text-sm text-text-primary mt-xs">{it.note}</p>
                    )}
                  </div>
                  <SavedListItemRemove token={token} itemId={it.id} />
                </div>
                <div className="mt-sm flex flex-wrap gap-xs text-xs">
                  {typeof it.utTripId === "number" && (
                    <Link
                      href={`/discover?utTripId=${it.utTripId}`}
                      className="rounded-pill border border-fjord/40 bg-fjord/10 px-sm py-1 font-bold text-fjord"
                    >
                      Åpne i Discover
                    </Link>
                  )}
                  <Link
                    href={`/lars-foreslar?title=${encodeURIComponent(it.title)}&area=${encodeURIComponent(it.area ?? "")}`}
                    className="rounded-pill border border-flame-pressed/40 bg-flame-bg/40 px-sm py-1 font-bold text-flame-pressed"
                  >
                    Planlegg denne
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-xl flex flex-wrap gap-sm text-sm">
          <Link
            href="/lister"
            className="text-fjord underline font-bold"
          >
            Alle lister
          </Link>
          <Link href="/discover" className="text-fjord underline font-bold">
            Finn flere turer
          </Link>
        </div>
      </div>
    </main>
  );
}
