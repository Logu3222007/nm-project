export type ErrorCode =
  | "UNAUTHENTICATED"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "GENERATION_FAILED"
  | "EXPORT_FAILED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  UNAUTHORIZED: 403,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  GENERATION_FAILED: 502,
  EXPORT_FAILED: 502,
  INTERNAL_ERROR: 500,
};

/** Structured, safe error response. Never includes stack traces, DB errors,
 * or raw upstream (Gemini/Postgres) error bodies. */
export function errorResponse(code: ErrorCode, message: string, requestId: string, headers: HeadersInit) {
  return new Response(JSON.stringify({ code, message, requestId }), {
    status: STATUS_BY_CODE[code],
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
