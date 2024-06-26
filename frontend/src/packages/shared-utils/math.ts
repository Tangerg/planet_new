export function getRandomInt(min: number, max: number): number {
    if (min >= max) {
        throw new Error("the first number should less than second")
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
