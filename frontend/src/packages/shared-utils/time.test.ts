import {sleep} from "./time";

test("sleep", async () => {
    console.log("start", new Date().getTime())
    await sleep(4000)
    console.log("end", new Date().getTime())
})
