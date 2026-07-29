export type Duration = number;

const Millisecond: Duration = 1;
export const Second: Duration = 1000 * Millisecond;
export const Minute: Duration = 60 * Second;
export const Hour: Duration = 60 * Minute;
const Day: Duration = 24 * Hour;

/**
 * How long ago a past timestamp was, bucketed the way a compact "time ago"
 * label needs it. Classified, never formatted: the wording and the locale are
 * the presentation layer's to choose.
 */
export type RelativeTime =
  | Readonly<{ unit: "now" }>
  | Readonly<{ unit: "minute" | "hour" | "day"; value: number }>
  /** Older than ~a month — too far back to count, so name the calendar day. */
  | Readonly<{ unit: "date"; at: Duration }>;

/**
 * Bucket how long ago `at` was. `now` is injected (defaulting to the wall
 * clock) so the classification stays pure and testable.
 */
export function relativeTime(at: Duration, now: Duration = Date.now()): RelativeTime {
  const diff = Math.max(0, now - at);
  if (diff < Minute) return { unit: "now" };
  if (diff < Hour) return { unit: "minute", value: Math.floor(diff / Minute) };
  if (diff < Day) return { unit: "hour", value: Math.floor(diff / Hour) };
  if (diff < 30 * Day) return { unit: "day", value: Math.floor(diff / Day) };
  return { unit: "date", at };
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
 * @param fractionStr - optional fractional-second digits *as written*: the digit
 *   count sets the scale, so ".5" is 500ms and ".05" is 50ms. One field carries
 *   hundredths or thousandths depending on who wrote the tag, so it can only be
 *   read as a fraction — never as a millisecond count.
 * @returns the time in milliseconds
 */
export function parseTimestamp(minStr: string, secStr: string, fractionStr?: string): Duration {
  const min = parseInt(minStr, 10);
  const sec = parseInt(secStr, 10);
  const fraction = fractionStr ? parseInt(fractionStr, 10) / 10 ** fractionStr.length : 0;
  return min * Minute + sec * Second + Math.round(fraction * Second);
}
