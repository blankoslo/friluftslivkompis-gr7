import Link from "next/link";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SavedList, type ISavedListItem } from "@/models/SavedList";

export const dynamic = "force-dynamic";

interface ListSummary {
  id: string;
  name: string;
  description: string;
  shareToken: string;
  ownerName: string;
  count: number;
  preview: string[];
  updatedAt?: Date;
}

async function loadAll(): Promise<ListSummary[]> {
  await connectToDatabase();
  const docs = await SavedList.find()
    .sort({ updatedAt: -1 })
    .limit(60)
    .lean<
      Array<{
        _id: unknown;
        name: string;
        description?: string;
        shareToken: string;
        ownerName?: string;
        items: ISavedListItem[];
        updatedAt?: Date;
      }>
    >();
  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    description: d.description ?? "",
    shareToken: d.shareToken,
    ownerName: d.ownerName ?? "",
    count: (d.items ?? []).length,
    preview: (d.items ?? []).slice(0, 3).map((i) => i.title),
    updatedAt: d.updatedAt,
  }));
}

export default async function ListsIndex() {
  const lists = await loadAll();
  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-[48rem] mx-auto px-md py-lg sm:px-lg sm:py-xl">
        <header className="mb-lg">
          <p
            className="text-small font-bold uppercase tracking-label text-text-muted"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            Delte turlister
          </p>
          <h1 className="font-heading text-h1 font-black text-text-primary mt-xs">
            Turlister
          </h1>
          <p
            className="text-base mt-xs text-text-primary"
            style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
          >
            &ldquo;Drømmer er bare drømmer til de står i en liste.&rdquo; -
            Lars
          </p>
        </header>

        {lists.length === 0 ? (
          <p
            className="text-text-primary text-lg leading-snug"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            Ingen lister enda. Lagre en tur fra Discover for å starte.
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-md">
            {lists.map((l) => (
              <li
                key={l.id}
                className="bg-bg border-4 border-flame-pressed rounded-lg p-md shadow-[6px_6px_0_var(--brand-flame-pressed)]"
              >
                <Link
                  href={`/lister/${l.shareToken}`}
                  className="block hover:opacity-90"
                >
                  <h2 className="font-heading text-h3 font-bold text-flame-pressed mb-xs">
                    {l.name}
                  </h2>
                  <p className="text-xs text-text-muted mb-sm">
                    {l.count} {l.count === 1 ? "tur" : "turer"}
                    {l.ownerName ? ` · ${l.ownerName}` : ""}
                  </p>
                  {l.description && (
                    <p className="text-sm text-text-primary mb-sm">
                      {l.description}
                    </p>
                  )}
                  {l.preview.length > 0 && (
                    <ul className="text-xs text-text-muted">
                      {l.preview.map((p) => (
                        <li key={p}>· {p}</li>
                      ))}
                    </ul>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-xl flex flex-wrap gap-sm text-sm">
          <Link href="/discover" className="text-fjord underline font-bold">
            Finn turer å lagre →
          </Link>
        </div>
      </div>
    </main>
  );
}
