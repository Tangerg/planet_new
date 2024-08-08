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

export function debounce<T extends (...args: any) => void>(
    func: T,
    duration: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
        const context = this;
        if (timer !== undefined) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            func.apply(context, args);
        }, duration);
    };
}