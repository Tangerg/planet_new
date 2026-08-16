import type { Logger } from "dougong";
import { errorMessage, warn } from "@shared/debug";

/**
 * Routes kernel diagnostics into the application's single warn channel. The
 * kernel reports at four levels and passes structured details alongside the
 * message; this flattens both into text so nothing is silently dropped on the
 * way out — debug/info included, because a plugin graph that reorganizes itself
 * without saying so is the hard kind of bug to chase.
 */
function line(level: string, message: unknown, details: readonly unknown[]): void {
  const rest = details.map((detail) => errorMessage(detail)).join(" ");
  warn(`${level} ${errorMessage(message)}${rest ? ` ${rest}` : ""}`);
}

export const kernelLogger: Logger = {
  debug: (message, ...details) => line("kernel debug:", message, details),
  info: (message, ...details) => line("kernel info:", message, details),
  warn: (message, ...details) => line("kernel:", message, details),
  error: (message, ...details) => line("kernel error:", message, details),
};
