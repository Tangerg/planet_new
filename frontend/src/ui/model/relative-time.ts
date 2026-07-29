import type { RelativeTime } from "@shared/time";

import type { LocalizedText } from "@/i18n/text";

/**
 * Name a bucketed elapsed time. The count buckets are message keys so the
 * active language words them; the calendar-day bucket is already text, so it is
 * carried as text — formatted against the UI language rather than the host's.
 */
export function relativeTimeText(value: RelativeTime, language: string): LocalizedText {
  switch (value.unit) {
    case "now":
      return { key: "time.justNow" };
    case "minute":
      return { key: "time.minutesAgo", values: { count: value.value } };
    case "hour":
      return { key: "time.hoursAgo", values: { count: value.value } };
    case "day":
      return { key: "time.daysAgo", values: { count: value.value } };
    case "date":
      return { text: new Date(value.at).toLocaleDateString(language) };
  }
}
