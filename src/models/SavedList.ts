import mongoose, { Schema, model, models } from "mongoose";

export interface ISavedListItem {
  _id?: mongoose.Types.ObjectId;
  utTripId?: number;
  tripId?: mongoose.Types.ObjectId;
  title: string;
  area?: string;
  lat?: number;
  lon?: number;
  imageUrl?: string;
  note?: string;
  addedAt: Date;
}

export interface ISavedList {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  shareToken: string;
  ownerName?: string;
  items: ISavedListItem[];
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<ISavedListItem>(
  {
    utTripId: Number,
    tripId: { type: Schema.Types.ObjectId, ref: "Trip" },
    title: { type: String, required: true },
    area: String,
    lat: Number,
    lon: Number,
    imageUrl: String,
    note: String,
    addedAt: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

const savedListSchema = new Schema<ISavedList>(
  {
    name: { type: String, required: true },
    description: String,
    shareToken: { type: String, required: true, unique: true, index: true },
    ownerName: String,
    items: [itemSchema],
  },
  { timestamps: true },
);

export const SavedList =
  models.SavedList || model<ISavedList>("SavedList", savedListSchema);
