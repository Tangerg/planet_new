import {getNumberInRange, getRandomInt, getRandomIntExclude} from "./math";

test("getRandomInt", () => {
    const res = getRandomInt(0, 1)
    console.log(res)
})
test("getRandomIntExclude", () => {
    const res = getRandomIntExclude(0, 100, 1)
    console.log(res)
})

test("getNumberInRange", () => {
    let res = getNumberInRange(0, 5, 10)
    console.log(res)
    res = getNumberInRange(0, 5, -10)
    console.log(res)
    res = getNumberInRange(0, 5, 3)
    console.log(res)
    res = getNumberInRange(0, 5.1, 5.01)
    console.log(res)
    res = getNumberInRange(1, 1, 2)
    console.log(res)
    res = getNumberInRange(1, 1, 1)
    console.log(res)
    res = getNumberInRange(1, 0, 1)
    console.log(res)
})
