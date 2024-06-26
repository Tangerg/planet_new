export function sleep(timeout: number): Promise<void> {
    let timer: number = 0
    return new Promise<void>(resolve => {
        timer = setTimeout(() => {
            clearTimeout(timer)
            resolve()
        }, timeout) as unknown as number
    });
}
