export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export function shuffleArray<T>(arr: Array<T> | ReadonlyArray<T>): Array<T> {
    const rv = arr.slice(0)
    for (let i = 0; i < arr.length; i++) {
        let j = getRandomInt(0, i)
        let t = rv[i]
        rv[i] = rv[j]
        rv[j] = t
    }
    return rv
}
