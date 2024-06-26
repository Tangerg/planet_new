import IEventEmitter, {IEventListener, IEventMap} from "./types";
import {createOnceFunction} from "../shared-utils/function";

type EventListener = {
    fn: Function
    ctx: Object
}
type EventListeners = Array<Readonly<EventListener>>

export class EventEmitter<E extends IEventMap> implements IEventEmitter<E> {
    private readonly listeners: Map<keyof E, EventListeners>

    constructor() {
        this.listeners = new Map<keyof E, EventListeners>()
    }


    private assertGet(name: keyof E): EventListeners {
        return this.listeners.get(name) as EventListeners
    }

    on<K extends keyof E>(name: K, fn: IEventListener<E, K>, ctx: Object = this): IEventEmitter<E> {
        if (!this.listeners.has(name)) {
            this.listeners.set(name, [])
        }
        this.assertGet(name).push({fn, ctx})
        return this
    }

    once<K extends keyof E>(name: K, fn: IEventListener<E, K>, ctx: Object = this): IEventEmitter<E> {
        const onceFn = createOnceFunction(fn, () => {
            this.off(name, onceFn)
        })
        return this.on(name, onceFn, ctx)
    }

    off<K extends keyof E>(name: K, fn?: IEventListener<E, K>): IEventEmitter<E> {
        if (!this.listeners.has(name)) {
            return this
        }

        if (!Boolean(fn)) {
            this.listeners.set(name, [])
            return this
        }

        const listeners = this.assertGet(name)

        let count = listeners.length
        while (count--) {
            if (listeners[count].fn === fn) {
                listeners.splice(count, 1)
            }
        }

        return this
    }

    private emitAll(arg?: any): void {
        this.listeners.forEach(listeners => {
            listeners.forEach(listener => {
                if (Boolean(listener.fn)) {
                    listener.fn.call(listener.ctx, arg)
                }
            })
        })
    }

    private emitByName<T extends keyof E>(name: T, arg?: E[T]): void {
        if (!this.listeners.has(name)) {
            return;
        }
        const listeners = this.assertGet(name)

        listeners.forEach(listener => {
            if (Boolean(listener.fn)) {
                listener.fn.call(listener.ctx, arg)
            }
        })
    }

    emit<T extends keyof E>(name: T, arg?: E[T]): void {
        if (name === "*") {
            return this.emitAll(arg)
        }
        return this.emitByName(name, arg)
    }

    clear(): void {
        this.listeners.clear()
    }


}

export default EventEmitter
