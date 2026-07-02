import { activeLyricIndex, parseLyrics, type Lyric } from "./lyric";
import { describe, expect, test } from "vitest";

test("lyric_format", () => {
  const lrc =
    "[00:00] 作词 : 张国祥\n" +
    "[00:01:000] 作曲 : 汤小康\n" +
    "[00:04.050]\n" +
    "[00:12.570]难以忘记初次见你\n" +
    "[00:16.860]一双迷人的眼睛\n" +
    "[00:21.460]在我脑海里\n" +
    "[00:23.960]你的身影 挥散不去\n" +
    "[00:30.160]握你的双手感觉你的温柔\n" +
    "[00:34.940]真的有点透不过气\n" +
    "[00:39.680]你的天真 我想珍惜\n" +
    "[00:43.880]看到你受委屈 我会伤心\n" +
    "[00:48.180]喔\n" +
    "[00:50.340]只怕我自己会爱上你\n" +
    "[00:55.070]不敢让自己靠的太近\n" +
    "[00:59.550]怕我没什么能够给你\n" +
    "[01:04.030]爱你也需要很大的勇气\n" +
    "[01:08.190]只怕我自己会爱上你\n" +
    "[01:12.910]也许有天会情不自禁\n" +
    "[01:17.380]想念只让自己苦了自己\n" +
    "[01:21.840]爱上你是我情非得已\n" +
    "[01:28.810]难以忘记初次见你\n" +
    "[01:33.170]一双迷人的眼睛\n" +
    "[01:37.700]在我脑海里 你的身影 挥散不去\n" +
    "[01:46.360]握你的双手感觉你的温柔\n" +
    "[01:51.120]真的有点透不过气\n" +
    "[01:55.910]你的天真 我想珍惜\n" +
    "[02:00.150]看到你受委屈 我会伤心\n" +
    "[02:04.490]喔\n" +
    "[02:06.540]只怕我自己会爱上你\n" +
    "[02:11.240]不敢让自己靠的太近\n" +
    "[02:15.750]怕我没什么能够给你\n" +
    "[02:20.200]爱你也需要很大的勇气\n" +
    "[02:24.570]只怕我自己会爱上你\n" +
    "[02:29.230]也许有天会情不自禁\n" +
    "[02:33.680]想念只让自己苦了自己\n" +
    "[02:38.140]爱上你是我情非得已\n" +
    "[03:04.060]什么原因 耶\n" +
    "[03:07.730]我竟然又会遇见你\n" +
    "[03:13.020]我真的真的不愿意\n" +
    "[03:16.630]就这样陷入爱的陷阱\n" +
    "[03:20.700]喔\n" +
    "[03:22.910]只怕我自己会爱上你\n" +
    "[03:27.570]不敢让自己靠的太近\n" +
    "[03:32.040]怕我没什么能够给你\n" +
    "[03:36.560]爱你也需要很大的勇气\n" +
    "[03:40.740]只怕我自己会爱上你\n" +
    "[03:45.460]也许有天会情不自禁\n" +
    "[03:49.990]想念只让自己苦了自己\n" +
    "[03:54.510]爱上你是我情非得已\n" +
    "[03:58.970]爱上你是我情非得已\n" +
    "[04:03.000]\n";
  const result = parseLyrics(lrc);
  expect(result).toBeInstanceOf(Array);
  expect(result.length).toBeGreaterThan(0);
  expect(result[0].content).toBe("作词 : 张国祥");
  expect(result[0].duration).toBeGreaterThanOrEqual(0);
  // [00:01:000] = 0 min, 1 sec, 0 ms = 1000
  expect(result[1].duration).toBe(1_000);
});

test("lyric_format2", () => {
  const result = parseLyrics("");
  expect(result).toEqual([]);
});

describe("activeLyricIndex", () => {
  const lines: Lyric[] = [
    { content: "A", duration: 0 },
    { content: "B", duration: 5_000 },
    { content: "C", duration: 12_000 },
  ];

  test("returns the last line at or before the position (ms)", () => {
    expect(activeLyricIndex(lines, 0)).toBe(0);
    expect(activeLyricIndex(lines, 6_000)).toBe(1);
    expect(activeLyricIndex(lines, 99_000)).toBe(2);
  });

  test("holds the first line before the first timestamp", () => {
    expect(activeLyricIndex([{ content: "A", duration: 1_000 }], 0)).toBe(0);
  });

  test("returns 0 for an empty list", () => {
    expect(activeLyricIndex([], 5_000)).toBe(0);
  });
});
