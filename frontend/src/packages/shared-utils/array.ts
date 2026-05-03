import {getRandomInt} from "./math";

export function shuffleArray<T>(arr: Array<T> | ReadonlyArray<T>): Array<T> {
    const result = arr.slice();
    for (let i = result.length - 1; i > 0; i--) {
        // Fisher-Yates 需要 j ∈ [0, i]，对应半开区间 [0, i+1)
        const j = getRandomInt(0, i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
