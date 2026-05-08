import { ImageResponse } from "next/og";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip } from "@/models/Trip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function fmtDate(d?: Date) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  let title = "På tur med Monsen";
  let area = "";
  let dateRange = "";
  let cabinCount = 0;
  let participantCount = 0;

  try {
    await connectToDatabase();
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { inviteToken: id }] }
      : { inviteToken: id };
    const doc = await Trip.findOne(query)
      .select("title area startDate endDate cabins participants")
      .lean<{
        title: string;
        area?: string;
        startDate?: Date;
        endDate?: Date;
        cabins?: unknown[];
        participants?: unknown[];
      } | null>();
    if (doc) {
      title = doc.title;
      area = doc.area ?? "";
      cabinCount = (doc.cabins ?? []).length;
      participantCount = (doc.participants ?? []).length;
      const start = fmtDate(doc.startDate);
      const end = fmtDate(doc.endDate);
      dateRange = start && end ? `${start} - ${end}` : start;
    }
  } catch {
    // fallthrough to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#D44520",
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
            opacity: 0.9,
            display: "flex",
          }}
        >
          På tur med Monsen
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 900,
            lineHeight: 1.05,
            marginTop: 32,
            display: "flex",
          }}
        >
          {title}
        </div>
        {area ? (
          <div
            style={{
              fontSize: 36,
              marginTop: 16,
              opacity: 0.92,
              display: "flex",
            }}
          >
            {area}
          </div>
        ) : null}
        <div style={{ flexGrow: 1 }} />
        <div
          style={{
            display: "flex",
            gap: 32,
            fontSize: 28,
            fontWeight: 700,
            opacity: 0.95,
          }}
        >
          {dateRange ? <span>{dateRange}</span> : null}
          {cabinCount > 0 ? (
            <span>
              {cabinCount} {cabinCount === 1 ? "hytte" : "hytter"}
            </span>
          ) : null}
          {participantCount > 0 ? (
            <span>
              {participantCount}{" "}
              {participantCount === 1 ? "deltaker" : "deltakere"}
            </span>
          ) : null}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 22,
            fontStyle: "italic",
            opacity: 0.85,
            display: "flex",
          }}
        >
          &ldquo;Det er bare å begynne å gå.&rdquo; - Lars
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
