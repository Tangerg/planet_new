export type Duration = number;

export const Millisecond: Duration = 1;
export const Second: Duration = 1000 * Millisecond;
export const Minute: Duration = 60 * Second;
export const Hour: Duration = 60 * Minute;
const Day: Duration = 24 * Hour;

/**
 * A compact "time ago" label for a past timestamp (e.g. a comment's posted-at).
 * `now` is injected (defaulting to the wall clock) so the function stays pure
 * and testable. Falls back to a locale date once older than ~a month.
 */
export function relativeTime(at: Duration, now: Duration = Date.now()): string {
  const diff = Math.max(0, now - at);
  if (diff < Minute) return "just now";
  if (diff < Hour) return `${Math.floor(diff / Minute)}m ago`;
  if (diff < Day) return `${Math.floor(diff / Hour)}h ago`;
  if (diff < 30 * Day) return `${Math.floor(diff / Day)}d ago`;
  return new Date(at).toLocaleDateString();
}

/**
 * Format a duration.
 * @param duration length to format, in milliseconds (floored)
 * @param units granularity steps; only Hour, Minute, Second are accepted
 * @return a "[h]:[m]:[s]" string; the number of parts depends on the units passed
 */
export function formatDuration(duration: Duration, units: Duration[]): string {
  duration = Math.max(duration, 0);
  return units
    .map((uint) => {
      const time = Math.floor(duration / uint)
        .toString()
        .padStart(2, "0");
      duration %= uint;
      return time;
    })
    .join(":");
}

/**
 * Parse a timestamp into milliseconds.
 * @param minStr - minutes part
 * @param secStr - seconds part
 * @param msStr - optional milliseconds part
 * @returns the time in milliseconds
 */
export function parseTimestamp(minStr: string, secStr: string, msStr?: string): Duration {
  const min = parseInt(minStr, 10);
  const sec = parseInt(secStr, 10);
  const ms = msStr ? parseInt(msStr, 10) : 0;
  return min * Minute + sec * Second + ms * Millisecond;
}
