import mongoose, { Schema, model, models } from "mongoose";

export type TripPhase =
  | "discover"
  | "decide"
  | "gather"
  | "prepare"
  | "go"
  | "return";

export interface IParticipant {
  _id?: mongoose.Types.ObjectId;
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

export type PackingCategory =
  | "klær"
  | "sove"
  | "mat"
  | "navigasjon"
  | "sikkerhet"
  | "fellesutstyr"
  | "annet";

export interface IPackingItem {
  _id?: mongoose.Types.ObjectId;
  name: string;
  assignedTo?: mongoose.Types.ObjectId;
  packed: boolean;
  isAiSuggested: boolean;
  quantity?: number;
  category?: PackingCategory;
  isShared?: boolean;
  weightGrams?: number;
  reason?: string;
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

export type MealType = "frokost" | "lunsj" | "middag" | "snack";

export interface IIngredient {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  weightGrams?: number;
}

export interface IMeal {
  type: MealType;
  name: string;
  ingredients: IIngredient[];
}

export interface IMealDay {
  dayNumber: number;
  participantsToday: number;
  meals: IMeal[];
}

export interface IShoppingItem {
  _id?: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  assignedTo?: mongoose.Types.ObjectId;
  bought: boolean;
}

export interface IConsumable {
  _id?: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
  reason?: string;
  assignedTo?: mongoose.Types.ObjectId;
  bought: boolean;
}

export interface IReminder {
  _id?: mongoose.Types.ObjectId;
  daysBefore: number;
  label: string;
  kind: "pakk" | "handle" | "vær" | "annet";
}

export type EmergencyRole =
  | "turleder"
  | "pårørende"
  | "fastlege"
  | "forsikring"
  | "annet";

export interface IEmergencyContact {
  _id?: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  role: EmergencyRole;
  note?: string;
}

export interface IPackingSnapshot {
  weatherKey?: string;
  participantsHash?: string;
  durationDays?: number;
  generatedAt?: Date;
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
  packingSnapshot?: IPackingSnapshot;
  mealPlan: IMealDay[];
  shoppingList: IShoppingItem[];
  consumables: IConsumable[];
  reminders: IReminder[];
  emergencyContacts: IEmergencyContact[];
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

const PACKING_CATEGORIES = [
  "klær",
  "sove",
  "mat",
  "navigasjon",
  "sikkerhet",
  "fellesutstyr",
  "annet",
] as const;

const packingItemSchema = new Schema<IPackingItem>({
  name: { type: String, required: true },
  assignedTo: { type: Schema.Types.ObjectId },
  packed: { type: Boolean, default: false },
  isAiSuggested: { type: Boolean, default: false },
  quantity: { type: Number, default: 1 },
  category: { type: String, enum: PACKING_CATEGORIES },
  isShared: { type: Boolean, default: false },
  weightGrams: { type: Number },
  reason: { type: String },
});

const ingredientSchema = new Schema<IIngredient>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    category: String,
    weightGrams: Number,
  },
  { _id: false },
);

const mealSchema = new Schema<IMeal>(
  {
    type: {
      type: String,
      enum: ["frokost", "lunsj", "middag", "snack"],
      required: true,
    },
    name: { type: String, required: true },
    ingredients: [ingredientSchema],
  },
  { _id: false },
);

const mealDaySchema = new Schema<IMealDay>(
  {
    dayNumber: { type: Number, required: true },
    participantsToday: { type: Number, required: true },
    meals: [mealSchema],
  },
  { _id: false },
);

const shoppingItemSchema = new Schema<IShoppingItem>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  category: String,
  assignedTo: { type: Schema.Types.ObjectId },
  bought: { type: Boolean, default: false },
});

const consumableSchema = new Schema<IConsumable>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  reason: String,
  assignedTo: { type: Schema.Types.ObjectId },
  bought: { type: Boolean, default: false },
});

const reminderSchema = new Schema<IReminder>({
  daysBefore: { type: Number, required: true },
  label: { type: String, required: true },
  kind: {
    type: String,
    enum: ["pakk", "handle", "vær", "annet"],
    default: "annet",
  },
});

const EMERGENCY_ROLES = [
  "turleder",
  "pårørende",
  "fastlege",
  "forsikring",
  "annet",
] as const;

const emergencyContactSchema = new Schema<IEmergencyContact>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: EMERGENCY_ROLES, default: "annet" },
  note: String,
});

const packingSnapshotSchema = new Schema<IPackingSnapshot>(
  {
    weatherKey: String,
    participantsHash: String,
    durationDays: Number,
    generatedAt: Date,
  },
  { _id: false },
);

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
    packingSnapshot: packingSnapshotSchema,
    mealPlan: [mealDaySchema],
    shoppingList: [shoppingItemSchema],
    consumables: [consumableSchema],
    reminders: [reminderSchema],
    emergencyContacts: [emergencyContactSchema],
    expenses: [expenseSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Trip = models.Trip || model<ITrip>("Trip", tripSchema);
