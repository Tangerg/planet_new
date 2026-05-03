import IEventEmitter, {IEventListener, IEventMap} from "./types";

type Listener = {
    fn: Function
    ctx: object
    once: boolean
}

export class EventEmitter<E extends IEventMap> implements IEventEmitter<E> {
    private readonly listeners: Map<keyof E, Listener[]>

    constructor() {
        this.listeners = new Map<keyof E, Listener[]>()
    }

    private getOrCreate(name: keyof E): Listener[] {
        let list = this.listeners.get(name)
        if (!list) {
            list = []
            this.listeners.set(name, list)
        }
        return list
    }

    on<K extends keyof E>(name: K, fn: IEventListener<E, K>, ctx: object = this): IEventEmitter<E> {
        this.getOrCreate(name).push({fn, ctx, once: false})
        return this
    }

    once<K extends keyof E>(name: K, fn: IEventListener<E, K>, ctx: object = this): IEventEmitter<E> {
        this.getOrCreate(name).push({fn, ctx, once: true})
        return this
    }

    off<K extends keyof E>(name: K, fn?: IEventListener<E, K>): IEventEmitter<E> {
        const list = this.listeners.get(name)
        if (!list) {
            return this
        }
        if (!fn) {
            this.listeners.set(name, [])
            return this
        }
        // 用 filter 生成新数组，避免在 emit 期间被外部 off 影响 emit 的快照
        this.listeners.set(name, list.filter(l => l.fn !== fn))
        return this
    }

    private emitByName<T extends keyof E>(name: T, arg?: E[T]): void {
        const list = this.listeners.get(name)
        if (!list || list.length === 0) {
            return
        }
        // emit 期间 listener 内若 on/off/once，影响的是新数组；本次派发用快照
        const snapshot = list.slice()
        for (const l of snapshot) {
            l.fn.call(l.ctx, arg)
            if (l.once) {
                this.off(name, l.fn as IEventListener<E, T>)
            }
        }
    }

    emit<T extends keyof E>(name: T, arg?: E[T]): void {
        if (name === "*") {
            // wildcard 派发：把同一个 arg 派给每个事件名的所有监听者
            for (const key of Array.from(this.listeners.keys())) {
                this.emitByName(key, arg as E[typeof key])
            }
            return
        }
        this.emitByName(name, arg)
    }

    clear(): void {
        this.listeners.clear()
    }
}

export default EventEmitter
