import {sleep, Timer} from "./time";

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
