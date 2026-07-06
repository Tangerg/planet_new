/** Log a non-fatal warning (plugin lifecycle anomalies, recoverable failures). */
export function warn(msg: string): void {
  console.warn(`[Planet warn]: ${msg}`);
}

/** Best-effort human message from an unknown thrown value. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Report a recoverable read failure against a named subject (e.g. a provider
 * capability like "netease.search"). One shape for every such report so a
 * *supported* read that still faulted is never confused with an unsupported one
 * (which returns its fallback silently) or an empty-but-successful one.
 */
export function warnReadFailure(subject: string, error: unknown): void {
  warn(`${subject} read failed: ${errorMessage(error)}`);
}

/** Report a recoverable command/write failure with the same stable shape. */
export function warnWriteFailure(subject: string, error: unknown): void {
  warn(`${subject} write failed: ${errorMessage(error)}`);
}
