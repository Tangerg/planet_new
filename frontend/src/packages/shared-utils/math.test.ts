import {getNumberInRange, getRandomInt, getRandomIntExclude, shuffleArray} from "./math";

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
