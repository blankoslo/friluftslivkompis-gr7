import mongoose, { Schema, model, models } from "mongoose";

export type TripPhase =
  | "discover"
  | "decide"
  | "gather"
  | "prepare"
  | "go"
  | "return";

export interface IParticipant {
  userId?: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  status: "invited" | "accepted" | "declined" | "pending";
  days?: number[];
}

export interface ILeg {
  dayNumber: number;
  fromHut: string;
  toHut: string;
  distanceKm: number;
  elevationGain: number;
  estimatedHours: number;
  weather?: object;
}

export interface ITripCabin {
  utId?: number;
  name: string;
  lat: number;
  lon: number;
}

export interface IPackingItem {
  name: string;
  assignedTo?: mongoose.Types.ObjectId;
  packed: boolean;
  isAiSuggested: boolean;
}

export interface IExpense {
  _id?: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  paidBy: mongoose.Types.ObjectId;
  splitAmong: mongoose.Types.ObjectId[];
  dayNumber?: number;
  createdAt?: Date;
}

export interface ITrip {
  _id: mongoose.Types.ObjectId;
  title: string;
  inviteToken: string;
  phase: TripPhase;
  area: string;
  startDate?: Date;
  endDate?: Date;
  location?: {
    lat: number;
    lng: number;
  };
  cabins: ITripCabin[];
  legs: ILeg[];
  participants: IParticipant[];
  packingList: IPackingItem[];
  expenses: IExpense[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  email: String,
  status: {
    type: String,
    enum: ["invited", "accepted", "declined", "pending"],
    default: "pending",
  },
  days: [Number],
});

const tripCabinSchema = new Schema<ITripCabin>(
  {
    utId: Number,
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
  },
  { _id: false },
);

const legSchema = new Schema<ILeg>({
  dayNumber: { type: Number, required: true },
  fromHut: { type: String, required: true },
  toHut: { type: String, required: true },
  distanceKm: { type: Number, required: true },
  elevationGain: { type: Number, required: true },
  estimatedHours: { type: Number, required: true },
  weather: { type: Schema.Types.Mixed },
});

const packingItemSchema = new Schema<IPackingItem>({
  name: { type: String, required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  packed: { type: Boolean, default: false },
  isAiSuggested: { type: Boolean, default: false },
});

const expenseSchema = new Schema<IExpense>(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    paidBy: { type: Schema.Types.ObjectId, required: true },
    splitAmong: [{ type: Schema.Types.ObjectId }],
    dayNumber: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const tripSchema = new Schema<ITrip>(
  {
    title: { type: String, required: true },
    inviteToken: { type: String, required: true, unique: true },
    phase: {
      type: String,
      enum: ["discover", "decide", "gather", "prepare", "go", "return"],
      default: "discover",
    },
    area: { type: String, default: "" },
    startDate: Date,
    endDate: Date,
    location: {
      lat: Number,
      lng: Number,
    },
    cabins: [tripCabinSchema],
    legs: [legSchema],
    participants: [participantSchema],
    packingList: [packingItemSchema],
    expenses: [expenseSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Trip = models.Trip || model<ITrip>("Trip", tripSchema);
