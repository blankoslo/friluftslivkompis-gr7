import mongoose, { Schema, model, models } from "mongoose";

export type ReviewSeason = "vinter" | "vår" | "sommer" | "høst";
export type ReviewGroupSize = "alene" | "par" | "familie" | "venner" | "stor-gjeng";

export interface IReview {
  _id: mongoose.Types.ObjectId;
  utTripId?: number;
  tripId?: mongoose.Types.ObjectId;
  targetTitle: string;
  targetArea?: string;
  rating: number;
  text: string;
  tags: string[];
  season?: ReviewSeason;
  groupSize?: ReviewGroupSize;
  visitedAt?: Date;
  authorName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    utTripId: { type: Number, index: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", index: true },
    targetTitle: { type: String, required: true },
    targetArea: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, maxlength: 2000 },
    tags: [{ type: String }],
    season: {
      type: String,
      enum: ["vinter", "vår", "sommer", "høst"],
    },
    groupSize: {
      type: String,
      enum: ["alene", "par", "familie", "venner", "stor-gjeng"],
    },
    visitedAt: Date,
    authorName: String,
  },
  { timestamps: true },
);

export const Review = models.Review || model<IReview>("Review", reviewSchema);
