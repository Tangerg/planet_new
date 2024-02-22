export function createOnceFunction<T extends Function>(this: unknown, fn: T, fnDoneCallback?: () => void): T {
    const _this = this;
    let called = false;
    let result: unknown;

    return function () {
        if (called) {
            return result;
        }
        called = true;
        if (fnDoneCallback) {
            try {
                result = fn.apply(_this, arguments);
            } finally {
                fnDoneCallback();
            }
        } else {
            result = fn.apply(_this, arguments);
        }
        return result;
    } as unknown as T;
}