import { ImageResponse } from "next/og";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SavedList } from "@/models/SavedList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export async function GET(_req: Request, { params }: Props) {
  const { token } = await params;
  let name = "Turliste";
  let description = "";
  let count = 0;
  let preview: string[] = [];
  let owner = "";

  try {
    await connectToDatabase();
    const doc = await SavedList.findOne({ shareToken: token })
      .select("name description ownerName items")
      .lean<{
        name: string;
        description?: string;
        ownerName?: string;
        items?: { title: string }[];
      } | null>();
    if (doc) {
      name = doc.name;
      description = doc.description ?? "";
      owner = doc.ownerName ?? "";
      const items = doc.items ?? [];
      count = items.length;
      preview = items.slice(0, 4).map((i) => i.title);
    }
  } catch {
    // fall through
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#1F4D2C",
          color: "#FFF6E5",
          padding: 64,
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: 0.85,
            display: "flex",
          }}
        >
          Turliste {owner ? `- ${owner}` : ""}
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1.05,
            marginTop: 24,
            display: "flex",
          }}
        >
          {name}
        </div>
        {description ? (
          <div
            style={{
              fontSize: 30,
              marginTop: 12,
              opacity: 0.9,
              display: "flex",
            }}
          >
            {description}
          </div>
        ) : null}
        <div style={{ flexGrow: 1 }} />
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", opacity: 0.95 }}>
            {count} {count === 1 ? "tur" : "turer"}
          </div>
          {preview.map((t) => (
            <div key={t} style={{ display: "flex", fontSize: 24, opacity: 0.85 }}>
              · {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
