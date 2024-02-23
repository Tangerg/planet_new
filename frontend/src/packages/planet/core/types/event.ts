export interface IEventEmitter {
    on(name: string, fn: Function, ctx?: Object): IEventEmitter

    once(name: string, fn: Function, ctx?: Object): IEventEmitter

    off(name: string, fn?: Function): IEventEmitter

    emit(name: string, ...args: any[]): void

    clear(): void
}
