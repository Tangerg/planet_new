/** Log a non-fatal warning (plugin lifecycle anomalies, recoverable failures). */
export function warn(msg: string): void {
  console.warn(`[Planet warn]: ${msg}`);
}

/** Best-effort human message from an unknown thrown value. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
