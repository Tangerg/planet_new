/** Log a non-fatal warning (plugin lifecycle anomalies, recoverable failures). */
export function warn(msg: string): void {
  console.warn(`[Planet warn]: ${msg}`);
}
