import {createOnceFunction} from "../../../shared-utils/function";
import {IEventMap, IEventListener, IEventEmitter} from "../types";


type Listener = {
    fn: Function
    ctx: Object
}
type Listeners = Array<Readonly<Listener>>

export class EventEmitter<E extends IEventMap> implements IEventEmitter<E> {

    private readonly events: Map<keyof E, Listeners>

    constructor() {
        this.events = new Map<string, Listeners>()
    }

    private mustGetListeners(name: keyof E): Listeners {
        return this.events.get(name) as Listeners
    }


    on<T extends keyof E>(name: T, fn: IEventListener<E, T>, ctx: Object = this): EventEmitter<E> {
        if (!this.events.has(name)) {
            this.events.set(name, [])
        }

        this.mustGetListeners(name).push({fn, ctx})

        return this
    }

    once<T extends keyof E>(name: T, fn: IEventListener<E, T>, ctx: Object = this): EventEmitter<E> {
        fn = createOnceFunction(fn)
        return this.on(name, fn, ctx)
    }

    off<T extends keyof E>(name: T, fn?: IEventListener<E, T>): EventEmitter<E> {
        if (!this.events.has(name)) {
            return this
        }

        if (!Boolean(fn)) {
            this.events.set(name, [])
            return this
        }

        const listeners = this.mustGetListeners(name)

        let count = listeners.length
        while (count--) {
            if (listeners[count].fn === fn) {
                listeners.splice(count, 1)
            }
        }

        return this
    }

    emit<T extends keyof E>(name: T, arg?: E[T]): void {
        if (!this.events.has(name)) {
            return;
        }
        const listeners = this.mustGetListeners(name)

        listeners.forEach(listener => {
            if (Boolean(listener.fn)) {
                listener.fn.call(listener.ctx, arg)
            }
        })
    }

    clear() {
        this.events.clear()
    }

}


export default EventEmitter
