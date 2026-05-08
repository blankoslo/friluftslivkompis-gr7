import { connectToDatabase } from "@/lib/db/mongoose";
import { ApiError, type ApiProvider } from "@/models/ApiError";

export type RecordApiErrorInput = {
  provider: ApiProvider;
  status?: number;
  message: string;
  endpoint?: string;
};

const AUTH_STATUSES = new Set([401, 403]);
const RATE_LIMIT_STATUS = 429;

export function isAuthFailure(status?: number): boolean {
  return typeof status === "number" && AUTH_STATUSES.has(status);
}

export async function recordApiError(input: RecordApiErrorInput): Promise<void> {
  const isAuth = isAuthFailure(input.status);
  const isRateLimit = input.status === RATE_LIMIT_STATUS;
  const tag = isAuth ? "[ADMIN_ALERT]" : isRateLimit ? "[RATE_LIMIT]" : "[API_ERROR]";

  console.error(
    `${tag} ${input.provider}${input.status ? ` ${input.status}` : ""}${input.endpoint ? ` ${input.endpoint}` : ""} - ${input.message}`,
  );

  try {
    await connectToDatabase();
    await ApiError.create({
      provider: input.provider,
      status: input.status,
      message: input.message.slice(0, 2000),
      endpoint: input.endpoint,
      isAuthFailure: isAuth,
    });
  } catch (err) {
    console.error("[api-monitor] failed to persist error:", err);
  }
}
