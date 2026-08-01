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

const WIRE_ERROR_PREFIX = "PLANET_ERROR:";

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

function isErrorCode(value: unknown): value is LocalLibraryErrorCode {
  return Object.values(LocalLibraryErrorCode).includes(value as LocalLibraryErrorCode);
}

/** Convert Wails' rejected Go error into the stable local-library error type. */
export function toLocalLibraryError(error: unknown): LocalLibraryError {
  if (error instanceof LocalLibraryError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const prefixAt = message.indexOf(WIRE_ERROR_PREFIX);
  if (prefixAt >= 0) {
    try {
      const payload = JSON.parse(message.slice(prefixAt + WIRE_ERROR_PREFIX.length)) as {
        code?: unknown;
        operation?: unknown;
      };
      if (isErrorCode(payload.code) && typeof payload.operation === "string") {
        return new LocalLibraryError(payload.code, payload.operation);
      }
    } catch {
      // Malformed bridge data is projected as a generic failure below.
    }
  }
  return new LocalLibraryError("failed", "bridge");
}

export async function localLibraryCall<T>(call: Promise<T>): Promise<T> {
  try {
    return await call;
  } catch (error) {
    throw toLocalLibraryError(error);
  }
}

export const LocalLibraryLookupStatus = { found: "found", notFound: "notFound" } as const;
export type LocalLibraryLookupStatus =
  (typeof LocalLibraryLookupStatus)[keyof typeof LocalLibraryLookupStatus];
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
