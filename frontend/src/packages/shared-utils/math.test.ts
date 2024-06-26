import {getRandomInt, getRandomIntExclude, shuffleArray} from "./math";

test("getRandomInt", () => {
    const res = getRandomInt(0, 1)
    console.log(res)
})
test("getRandomIntExclude", () => {
    const res = getRandomIntExclude(0, 100, 1)
    console.log(res)
})
test("shuffleArray", () => {
    const arr = Array.from([1, 2, 3, 4, 5])
    const arr1 = shuffleArray(arr)
    console.log(arr1)
})
