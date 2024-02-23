import {createOnceFunction} from "../../shared-utils/function";
import {IEventEmitter} from "../core";

type Listener = {
    fn: Function
    ctx: Object
}
type Listeners = Array<Readonly<Listener>>

export class EventEmitter implements IEventEmitter {

    private readonly events: Map<string, Listeners>

    constructor() {
        this.events = new Map<string, Listeners>()
    }

    private mustGetListeners(name: string): Listeners {
        return this.events.get(name) as Listeners
    }


    on(name: string, fn: Function, ctx: Object = this): EventEmitter {
        if (!this.events.has(name)) {
            this.events.set(name, [])
        }

        this.mustGetListeners(name).push({fn, ctx})

        return this
    }

    once(name: string, fn: Function, ctx: Object = this): EventEmitter {
        fn = createOnceFunction(fn)
        return this.on(name, fn, ctx)
    }

    off(name: string, fn?: Function): EventEmitter {
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

    emit(name: string, ...args: any[]): void {
        if (!this.events.has(name)) {
            return;
        }
        const listeners = this.mustGetListeners(name)

        listeners.forEach(listener => {
            if (!Boolean(listener.fn)) {
                listener.fn.apply(listener.ctx, args)
            }
        })
    }

    clear() {
        this.events.clear()
    }

}


export default EventEmitter
