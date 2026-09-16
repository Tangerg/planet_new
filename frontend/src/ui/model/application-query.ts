import type { QueryResult } from "@contexts/contracts";

export function queryDataOr<T>(result: QueryResult<T>, fallback: T): T {
  if (result.status === "success" || result.status === "partial") return result.data;
  if (result.status === "failed") throw result.error;
  return fallback;
}

export function queryDataOrNull<T>(result: QueryResult<T>): T | null {
  return queryDataOr<T | null>(result, null);
}
