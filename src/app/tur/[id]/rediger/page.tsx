import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip } from "@/models/Trip";
import { EditTripForm } from "./edit-form";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function RedigerTurPage({ params }: EditPageProps) {
  const { id } = await params;

  await connectToDatabase();
  const query = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { inviteToken: id }] }
    : { inviteToken: id };
  const doc = await Trip.findOne(query)
    .select("_id title area startDate endDate")
    .lean<{
      _id: mongoose.Types.ObjectId;
      title: string;
      area?: string;
      startDate?: Date;
      endDate?: Date;
    } | null>();

  if (!doc) notFound();

  const tripId = doc._id.toString();
  const initial = {
    title: doc.title,
    area: doc.area ?? "",
    startDate: doc.startDate ? doc.startDate.toISOString().slice(0, 10) : "",
    endDate: doc.endDate ? doc.endDate.toISOString().slice(0, 10) : "",
  };

  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-[42rem] mx-auto px-md py-xl sm:px-lg sm:py-2xl">
        <header className="mb-lg">
          <h1 className="font-heading text-h1 font-bold mb-xs text-text-primary">
            Rediger tur
          </h1>
          <p
            className="text-text-primary text-xl leading-snug"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            {doc.title}
          </p>
        </header>
        <EditTripForm tripId={tripId} initial={initial} />
      </div>
    </main>
  );
}
