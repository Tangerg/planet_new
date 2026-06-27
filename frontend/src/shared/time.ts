export type Duration = number;

export const Millisecond: Duration = 1;
export const Second: Duration = 1000 * Millisecond;
export const Minute: Duration = 60 * Second;
export const Hour: Duration = 60 * Minute;

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
