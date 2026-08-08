/** Cross-language application contract for the Go-owned Local Library Context. */
export const LocalLibraryErrorCode = {
  invalidArgument: "invalidArgument",
  unavailable: "unavailable",
  notFound: "notFound",
  incomplete: "incomplete",
  cancelled: "cancelled",
  failed: "failed",
} as const;
export type LocalLibraryErrorCode =
  (typeof LocalLibraryErrorCode)[keyof typeof LocalLibraryErrorCode];

export class LocalLibraryError extends Error {
  constructor(
    readonly code: LocalLibraryErrorCode,
    readonly operation: string,
    message = `Local library ${operation} failed (${code})`,
  ) {
    super(message);
    this.name = "LocalLibraryError";
  }
}

export class LocalLibraryUnavailableError extends LocalLibraryError {
  constructor() {
    super("unavailable", "bridge", "Local library bridge is unavailable");
    this.name = "LocalLibraryUnavailableError";
  }
}

/** The Go side's classified failure, as it arrives on a rejection's `cause`. */
type WireErrorPayload = { code: LocalLibraryErrorCode; operation: string };

function isWireErrorPayload(value: unknown): value is WireErrorPayload {
  if (typeof value !== "object" || value === null) return false;
  const { code, operation } = value as Record<string, unknown>;
  return (
    typeof operation === "string" &&
    Object.values(LocalLibraryErrorCode).includes(code as LocalLibraryErrorCode)
  );
}

/**
 * Convert Wails' rejected Go error into the stable local-library error type.
 *
 * The classified `code + operation` rides on the rejection's `cause`, which is
 * the channel the Go service's error marshaller writes to; the message stays
 * human-readable and is never parsed. Anything without a well-formed payload —
 * a framework failure, a transport error, a shape we do not recognise — fails
 * closed as a generic failure rather than being guessed at.
 */
export function toLocalLibraryError(error: unknown): LocalLibraryError {
  if (error instanceof LocalLibraryError) return error;
  const cause: unknown = error instanceof Error ? error.cause : undefined;
  if (isWireErrorPayload(cause)) return new LocalLibraryError(cause.code, cause.operation);
  return new LocalLibraryError("failed", "bridge");
}

export async function localLibraryCall<T>(call: Promise<T>): Promise<T> {
  try {
    return await call;
  } catch (error) {
    throw toLocalLibraryError(error);
  }
}

/** Scan outcomes as the UI consumes them. Unlike the Go-side lookup/scan enums
 *  (which the bindings publish directly to their one adapter), this vocabulary
 *  adds `unavailable` — a shell fact with no counterpart on the wire. */
export const LocalLibraryScanStatus = {
  cancelled: "cancelled",
  partial: "partial",
  complete: "complete",
  unavailable: "unavailable",
} as const;
export type LocalLibraryScanResult = Readonly<{
  status: "partial" | "complete";
  folder: string;
  scanned: number;
  added: number;
  total: number;
  durationMs: number;
}>;
export type LocalLibraryScanOutcome =
  | LocalLibraryScanResult
  | Readonly<{ status: "cancelled" }>
  | Readonly<{ status: "unavailable" }>;
