import type { RelativeTime } from "@shared/time";

import type { LocalizedText } from "@/i18n/text";

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
