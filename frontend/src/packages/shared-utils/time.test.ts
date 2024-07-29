import {sleep, Timer, formatDuration, formatDurationSeconds} from "./time";

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

test("formatDuration", () => {
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


test('formatDuration works correctly', () => {
    expect(formatDuration(0)).toBe("00:00:00");
    expect(formatDuration(999)).toBe("00:00:00");
    expect(formatDuration(1000)).toBe("00:00:01");
    expect(formatDuration(60 * 1000)).toBe("00:01:00");
    expect(formatDuration(3600 * 1000)).toBe("01:00:00");
    expect(formatDuration(3661 * 1000)).toBe("01:01:01");
});

test('formatDurationSeconds works correctly', () => {
    expect(formatDurationSeconds(0)).toBe("00:00:00");
    expect(formatDurationSeconds(1)).toBe("00:00:01");
    expect(formatDurationSeconds(60)).toBe("00:01:00");
    expect(formatDurationSeconds(3600)).toBe("01:00:00");
    expect(formatDurationSeconds(3661)).toBe("01:01:01");
});
