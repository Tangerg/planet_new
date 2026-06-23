import {
    sleep,
    Timer,
    formatDurationMillisecond,
    formatDurationSeconds,
    formatDuration,
    Hour,
    Minute,
    Second
} from "./time";
import { test,expect } from 'vitest'

test("sleep", async () => {
    console.log("start", new Date().getTime())
    await sleep(4000)
    console.log("end", new Date().getTime())
})

test("Timer", async () => {
    const timer = new Timer()
    await sleep(500)
    console.log(timer.duration) //0
    console.log(timer.isRunning)
    timer.run()
    await sleep(1500)
    console.log(timer.duration) //1500
    console.log(timer.isRunning)
    timer.pause()
    await sleep(500)
    console.log(timer.duration) //1500
    console.log(timer.isRunning)
    timer.run()
    await sleep(500)
    console.log(timer.duration) //2000
    console.log(timer.isRunning)
    timer.reset()
    console.log(timer.duration) //0
    console.log(timer.isRunning)
})

test("formatDurationSeconds", () => {
    console.log(formatDurationSeconds(-1))
    console.log(formatDurationSeconds(1))
    console.log(formatDurationSeconds(1.2))
    console.log(formatDurationSeconds(10))
    console.log(formatDurationSeconds(20))
    console.log(formatDurationSeconds(60))
    console.log(formatDurationSeconds(61))
    console.log(formatDurationSeconds(71))
    console.log(formatDurationSeconds(120))
    console.log(formatDurationSeconds(3600))
    console.log(formatDurationSeconds(3601))
    console.log(formatDurationSeconds(3661))
    console.log(formatDurationSeconds(1008080808080808))
})

test("formatDuration", () => {
    console.log(formatDuration(-1 * Second, [Hour, Minute, Second]))
    console.log(formatDuration(1 * Second, [Hour, Minute, Second]))
    console.log(formatDuration(1.2 * Minute, [Hour, Minute, Second]))
    console.log(formatDuration(1.2 * Minute, [Minute, Second]))
    console.log(formatDuration(1.2 * Minute, [Second]))
    console.log(formatDuration(10 * Second, [Hour, Minute, Second]))
    console.log(formatDuration(20 * Second, [Hour, Minute, Second]))
    console.log(formatDuration(20 * Second, [Minute, Second]))
    console.log(formatDuration(20 * Second, [Second]))
    console.log(formatDuration(90 * Second, [Second]))
})


test('formatDuration works correctly', () => {
    expect(formatDurationMillisecond(0)).toBe("00:00:00");
    expect(formatDurationMillisecond(999)).toBe("00:00:00");
    expect(formatDurationMillisecond(1000)).toBe("00:00:01");
    expect(formatDurationMillisecond(60 * 1000)).toBe("00:01:00");
    expect(formatDurationMillisecond(3600 * 1000)).toBe("01:00:00");
    expect(formatDurationMillisecond(3661 * 1000)).toBe("01:01:01");
});

test('formatDurationSeconds works correctly', () => {
    expect(formatDurationSeconds(0)).toBe("00:00:00");
    expect(formatDurationSeconds(1)).toBe("00:00:01");
    expect(formatDurationSeconds(60)).toBe("00:01:00");
    expect(formatDurationSeconds(3600)).toBe("01:00:00");
    expect(formatDurationSeconds(3661)).toBe("01:01:01");
});
