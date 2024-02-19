export interface IEventEmitter {
    on(name: string, fn: Function, ctx?: Object): IEventEmitter

    once(name: string, fn: Function, ctx?: Object): IEventEmitter

    off(name: string, fn?: Function): IEventEmitter

    emit(name: string, ...args: any[]): void

    clear(): void
}


type IEventField = {
    fn: Function
    ctx: Object
}

export class EventEmitter implements IEventEmitter {

    private events: {
        [name: string]: IEventField[]
    }

    constructor() {
        this.events = {}
    }

    on(name: string, fn: Function, ctx: Object = this): EventEmitter {
        if (!Boolean(this.events[name])) {
            this.events[name] = []
        }

        this.events[name].push({fn, ctx})
        return this
    }

    once(name: string, fn: Function, ctx: Object = this): EventEmitter {
        return this.on(name, this.createOnceFunc(fn, ctx), ctx)
    }

    off(name: string, fn?: Function): EventEmitter {
        const events = this.events[name]
        if (!Boolean(events)) {
            return this
        }
        if (!Boolean(fn)) {
            this.events[name] = []
            return this
        }

        let count = events.length
        while (count--) {
            if (events[count].fn === fn) {
                events.splice(count, 1)
            }
        }

        return this
    }

    emit(name: string, ...args: any[]): void {
        const events = this.events[name]
        if (!Boolean(events)) {
            return
        }
        events.forEach(event => {
            if (!Boolean(event.fn)) {
                event.fn.apply(event.ctx, args)
            }
        })
    }

    clear() {
        this.events = {}
    }

    private createOnceFunc(fn: Function, ctx: Object = this) {
        let called = false
        return function (this: any, ...args: any[]) {
            if (!called) {
                called = true
                fn.apply(ctx, args)
            }
        }
    }

}


export default EventEmitter
