import { describe, expect, it } from "vitest";

import { relativeTimeText } from "./relative-time";

describe("relativeTimeText", () => {
  it("names each counted bucket with a message key", () => {
    expect(relativeTimeText({ unit: "now" }, "en")).toEqual({ key: "time.justNow" });
    expect(relativeTimeText({ unit: "minute", value: 5 }, "en")).toEqual({
      key: "time.minutesAgo",
      values: { count: 5 },
    });
    expect(relativeTimeText({ unit: "hour", value: 2 }, "en")).toEqual({
      key: "time.hoursAgo",
      values: { count: 2 },
    });
    expect(relativeTimeText({ unit: "day", value: 3 }, "en")).toEqual({
      key: "time.daysAgo",
      values: { count: 3 },
    });
  });

  it("formats the calendar-day bucket against the UI language, not the host", () => {
    const at = Date.UTC(2024, 2, 5, 12);
    expect(relativeTimeText({ unit: "date", at }, "en-US")).toEqual({
      text: new Date(at).toLocaleDateString("en-US"),
    });
    expect(relativeTimeText({ unit: "date", at }, "zh-CN")).not.toEqual(
      relativeTimeText({ unit: "date", at }, "en-US"),
    );
  });
});
