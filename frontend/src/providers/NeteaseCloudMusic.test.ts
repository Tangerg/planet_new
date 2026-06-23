import {test} from "vitest";
import NeteaseCloudMusic from "./NeteaseCloudMusic";

test("NeteaseCloudMusic", async () => {
    const api = new NeteaseCloudMusic({host: "http://localhost:3000"})
    const res = await api.personalized()
    console.log(res)
})

test("NeteaseCloudMusic2", async () => {
    const api = new NeteaseCloudMusic({host: "http://localhost:3000"})
    const res = await api.playlistDetail("110759778")
    console.log(res)
})
test("NeteaseCloudMusic3", async () => {
    const api = new NeteaseCloudMusic({host: "http://localhost:3000"})
    const res = await api.playUrls(["2612337679"])
    console.log(res)
})