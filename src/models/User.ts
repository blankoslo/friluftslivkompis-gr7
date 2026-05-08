import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  preferences: {
    preferShortDays: boolean;
    maxDistanceKm: number;
    categories: string[];
  };
  tripHistory: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    preferences: {
      preferShortDays: { type: Boolean, default: false },
      maxDistanceKm: { type: Number, default: 20 },
      categories: [{ type: String }],
    },
    tripHistory: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", userSchema);
