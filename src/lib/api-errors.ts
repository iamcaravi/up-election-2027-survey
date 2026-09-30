import { NextResponse } from "next/server";

/**
 * Logs a failed API operation server-side and returns a controlled JSON 500.
 *
 * The full error (message, stack) goes to the server/Worker log only. The
 * response body carries just a generic message and a stable machine-readable
 * code, so clients can tell "temporarily unavailable" apart from "no data"
 * without ever seeing SQL, connection details or stack traces.
 */
export function apiServerError(route: string, operation: string, code: string, error: unknown) {
  console.error(`[api] ${route} ${operation} failed:`, error);
  return NextResponse.json(
    { error: "Temporary server error", code },
    { status: 500, headers: { "Cache-Control": "no-store" } }
  );
}
