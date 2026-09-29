export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "GENERATION_FAILED"
  | "EXPORT_FAILED"
  | "UPLOAD_FAILED"
  | "UNKNOWN";

export interface AppError {
  code: AppErrorCode;
  message: string;
  requestId?: string;
}

const FRIENDLY_MESSAGES: Record<AppErrorCode, string> = {
  UNAUTHENTICATED: "Please sign in to continue.",
  UNAUTHORIZED: "You don't have access to this resource.",
  VALIDATION_ERROR: "Please check the highlighted fields.",
  NOT_FOUND: "We couldn't find what you're looking for.",
  RATE_LIMITED: "Daily generation limit reached. Please try again later.",
  GENERATION_FAILED: "Generation couldn't be completed. Your document has not been lost.",
  EXPORT_FAILED: "We couldn't export your document. Please try again.",
  UPLOAD_FAILED: "We couldn't upload that file. Please check the format and size.",
  UNKNOWN: "Something went wrong. Please try again.",
};

/** Never surface raw database/Gemini/Supabase errors to the UI. */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  return { code: "UNKNOWN", message: FRIENDLY_MESSAGES.UNKNOWN };
}

function isAppError(e: unknown): e is AppError {
  return typeof e === "object" && e !== null && "code" in e && "message" in e;
}

export function friendlyMessage(code: AppErrorCode): string {
  return FRIENDLY_MESSAGES[code];
}
