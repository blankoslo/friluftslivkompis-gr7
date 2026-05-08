import { Schema, model, models } from "mongoose";

export type ApiProvider =
  | "anthropic"
  | "met"
  | "ut"
  | "kartverket"
  | "other";

export interface IApiError {
  provider: ApiProvider;
  status?: number;
  message: string;
  endpoint?: string;
  isAuthFailure: boolean;
  createdAt: Date;
}

const ApiErrorSchema = new Schema<IApiError>(
  {
    provider: { type: String, required: true },
    status: { type: Number },
    message: { type: String, required: true },
    endpoint: { type: String },
    isAuthFailure: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, index: true, expires: "30d" },
  },
  { versionKey: false },
);

export const ApiError = models.ApiError ?? model<IApiError>("ApiError", ApiErrorSchema);
