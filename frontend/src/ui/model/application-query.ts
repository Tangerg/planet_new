import type { QueryResult } from "@contexts/contracts";

/** UI policy for application query state. Partial data remains useful,
 * unsupported/not-found use the caller's view fallback, and failures enter the
 * React Query/error boundary path instead of being rendered as empty data. */
export function queryDataOr<T>(result: QueryResult<T>, fallback: T): T {
  if (result.status === "success" || result.status === "partial") return result.data;
  if (result.status === "failed") throw result.error;
  return fallback;
}

export function queryDataOrNull<T>(result: QueryResult<T>): T | null {
  if (result.status === "success" || result.status === "partial") return result.data;
  if (result.status === "failed") throw result.error;
  return null;
}
