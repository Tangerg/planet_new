export function createOnceFunction<T extends Function>(this: unknown, fn: T, fnDoneCallback?: () => void): T {
    const _this = this;
    let called = false;
    let result: unknown;

    return function () {
        if (called) {
            return result;
        }
        // 提前置位：保证 fn 抛错时再次调用直接走 cached return，
        // 同时 fnDoneCallback 仅在首次调用后触发一次（含异常路径）。
        called = true;
        try {
            result = fn.apply(_this, arguments);
            return result;
        } finally {
            fnDoneCallback?.();
        }
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