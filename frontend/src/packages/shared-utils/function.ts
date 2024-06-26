export function createOnceFunction<T extends Function>(this: unknown, fn: T, fnDoneCallback?: () => void): T {
    const _this = this;
    let called = false;
    let result: unknown;

    return function () {
        if (called) {
            return result;
        }

        try {
            result = fn.apply(_this, arguments);
        } finally {
            fnDoneCallback && fnDoneCallback()
        }

        called = true;
        return result;

    } as unknown as T;
}
