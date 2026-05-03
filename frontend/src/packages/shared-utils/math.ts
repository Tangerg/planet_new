/**
 * 在 [min, max) 区间内取整数（半开区间，符合数组索引习惯）。
 * @throws min >= max
 */
export function getRandomInt(min: number, max: number): number {
    if (min >= max) {
        throw new Error("min must be less than max")
    }
    return Math.floor(Math.random() * (max - min)) + min
}

/**
 * 在 [min, max) 区间内取整数，但排除指定值。
 * @throws 区间内只剩 exclude 一个候选时无解
 */
export function getRandomIntExclude(min: number, max: number, exclude: number): number {
    if (max - min <= 1 && Math.floor(exclude) === Math.floor(min)) {
        throw new Error("no candidate available after exclusion")
    }
    let random = getRandomInt(min, max)
    while (random === exclude) {
        random = getRandomInt(min, max)
    }
    return random
}

/**
 * 把 expect 夹到 [min, max] 范围内
 *
 * @param min 范围内的最小值, expect 比它小返回 min
 * @param max 范围内的最大值, expect 比它大返回 max
 * @param expect 期望从范围内获取的值
 */
export function getNumberInRange(min: number, max: number, expect: number): number {
    if (min > max) {
        throw new Error("min must be less than or equal to max")
    }
    if (expect < min) {
        return min
    }
    if (expect > max) {
        return max
    }
    return expect
}
