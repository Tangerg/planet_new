import { describe, expect, it } from "vitest";

import {
  effectiveMediaDuration,
  formatCompactMediaTime,
  formatMediaTime,
  mediaPlaybackPosition,
  mediaProgress,
  mediaSeekPercent,
  mediaTimelinePreview,
} from "./media-playback";

describe("media playback model", () => {
  it("derives an effective duration from runtime duration with metadata fallback", () => {
    expect(effectiveMediaDuration(240, 120)).toBe(240);
    expect(effectiveMediaDuration(0, 120)).toBe(120);
    expect(effectiveMediaDuration(0, undefined)).toBe(1);
    expect(effectiveMediaDuration(0, -4)).toBe(1);
  });

  it("uses override position while scrubbing and clamps live position to duration", () => {
    expect(mediaPlaybackPosition(42, 240, 10)).toBe(10);
    expect(mediaPlaybackPosition(280, 240, null)).toBe(240);
    expect(mediaPlaybackPosition(-5, 240, undefined)).toBe(0);
  });

  it("derives safe progress on the media timeline", () => {
    expect(mediaProgress(45, 180)).toBe(0.25);
    expect(mediaProgress(200, 100)).toBe(1);
    expect(mediaProgress(-5, 100)).toBe(0);
    expect(mediaProgress(5, 0)).toBe(0);
  });

  it("derives seek percent from a media position", () => {
    expect(mediaSeekPercent(45, 180)).toBe(25);
    expect(mediaSeekPercent(200, 100)).toBe(100);
    expect(mediaSeekPercent(-5, 100)).toBe(0);
    expect(mediaSeekPercent(5, 0)).toBe(0);
  });

  it("derives timeline preview position from pointer geometry", () => {
    expect(mediaTimelinePreview({ clientX: 160, left: 40, width: 240, durationSec: 120 })).toEqual({
      x: 120,
      positionSec: 60,
    });
    expect(mediaTimelinePreview({ clientX: 10, left: 40, width: 240, durationSec: 120 })).toEqual({
      x: 0,
      positionSec: 0,
    });
    expect(mediaTimelinePreview({ clientX: 400, left: 40, width: 240, durationSec: 120 })).toEqual({
      x: 240,
      positionSec: 120,
    });
    expect(mediaTimelinePreview({ clientX: 160, left: 40, width: 0, durationSec: 120 })).toEqual({
      x: 0,
      positionSec: 0,
    });
  });

  it("formats media time as minute-second labels", () => {
    expect(formatMediaTime(65.8)).toBe("01:05");
    expect(formatMediaTime(-10)).toBe("00:00");
    expect(formatCompactMediaTime(65.8)).toBe("1:05");
    expect(formatCompactMediaTime(-10)).toBe("0:00");
  });
});
