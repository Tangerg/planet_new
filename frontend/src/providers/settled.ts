/** Return a fulfilled section or its neutral fallback. */
export function settledOr<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

/**
 * Partial multi-endpoint reads may keep useful sections, but a complete outage
 * must remain a failure instead of masquerading as a successful empty result.
 */
export function requireSomeSettled(
  operation: string,
  results: readonly PromiseSettledResult<unknown>[],
): void {
  const failures = results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
  if (results.length > 0 && failures.length === results.length) {
    throw new AggregateError(failures, `${operation} failed`);
  }
}
