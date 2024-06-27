export function getRandomInt(min: number, max: number): number {
    if (min >= max) {
        throw new Error("The first number should be less than the second number")
    }
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export function getRandomIntExclude(min: number, max: number, exclude: number): number {
    try {
        let random = getRandomInt(min, max)
        while (random === exclude) {
            random = getRandomInt(min, max)
        }
        return random
    } catch (e) {
        throw e
    }
}

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

/**
 * 获取某个范围呢一个期望的值,
 *
 * @param min 范围内的最小值,如果期望的值比它小,则返回该值
 * @param max 范围内的最大值,如果期望的值比它大,则返回该值
 * @param expect 期望从范围内获取的值
 */
export function getNumberInRange(min: number, max: number, expect: number): number {
    if (min > max) {
        throw new Error("The first number should be less than or equal to the second number")
    }
    if (expect < min) {
        return min
    }
    if (expect > max) {
        return max
    }
    return expect
}
