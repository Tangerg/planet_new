import {getRandomInt} from "./math";

export function shuffleArray<T>(arr: Array<T> | ReadonlyArray<T>): Array<T> {
    const rv = arr.slice(0)
    for (let i = 1; i < arr.length; i++) {
        let j = getRandomInt(0, i)
        let t = rv[i]
        rv[i] = rv[j]
        rv[j] = t
    }
    return rv
}
