import {getRandomInt} from "./math";

export function shuffleArray<T>(arr: Array<T> | ReadonlyArray<T>): Array<T> {
    const result = arr.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
