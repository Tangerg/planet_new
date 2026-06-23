export type Duration = number;

export const Millisecond: Duration = 1;
export const Second: Duration = 1000 * Millisecond;
export const Minute: Duration = 60 * Second;
export const Hour: Duration = 60 * Minute;

export function sleep(duration: Duration): Promise<void> {
  if (!Number.isFinite(duration) || duration < 0) {
    duration = 0;
  }
  return new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });
}

export class Timer {
  protected state: "running" | "suspended" = "suspended";
  protected startAt: number = 0;
  protected lastPauseAt: number = 0;
  protected pausedDuration: Duration = 0;

  get isRunning(): boolean {
    return this.state === "running";
  }

  get duration(): Duration {
    const endAt = this.isRunning ? Date.now() : this.lastPauseAt;
    return endAt - this.startAt - this.pausedDuration;
  }

  run(): void {
    if (this.isRunning) {
      return;
    }
    const now = Date.now();
    if (this.startAt === 0) {
      this.startAt = now;
    }
    if (this.lastPauseAt !== 0) {
      this.pausedDuration += now - this.lastPauseAt;
    }
    this.state = "running";
  }

  pause(): void {
    if (!this.isRunning) {
      return;
    }
    this.lastPauseAt = Date.now();
    this.state = "suspended";
  }

  reset(): void {
    this.state = "suspended";
    this.startAt = 0;
    this.lastPauseAt = 0;
    this.pausedDuration = 0;
  }
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
 * Format a millisecond duration.
 * @param duration length to format, in milliseconds (floored)
 * @return a "00:00:00" string
 */
export function formatDurationMillisecond(duration: Duration): string {
  const units = [Hour, Minute, Second];
  return formatDuration(duration, units);
}

/**
 * Format a second-based duration.
 * @param seconds length to format, in seconds (floored)
 * @return a "00:00:00" string
 */
export function formatDurationSeconds(seconds: number): string {
  return formatDurationMillisecond(seconds * Second);
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
