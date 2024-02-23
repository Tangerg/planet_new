import {warn} from "../../shared-utils/debug";

export interface IManageable {
    id(): string
}

export interface IManager<T extends IManageable> {
    apply(ts: T[], t?: T): void

    clear(): void

    add(t: T): void

    remove(id: string): void

    all(): ReadonlyArray<Readonly<T>>

    get(id: string): Readonly<T> | null

    current(): Readonly<T> | null

    use(id: string): void
}

export abstract class AbstractManager<T extends IManageable> implements IManager<T> {
    private storeArray: T[]
    private readonly storeMap: Map<string, T>
    private _current: T | null

    protected constructor(ts?: T[], t?: T) {
        this.storeArray = []
        this.storeMap = new Map<string, T>()
        this._current = null
        if (ts && ts.length > 0) {
            this.apply(ts, t)
        }
    }

    private setCurrent(t: T): void {
        this._current = t
    }

    private removeItem(id: string): void {
        if (this.storeArray.length == 1) {
            this.clear()
            return
        }

        this.storeMap.delete(id)
        let idx = this.storeArray.findIndex((t) => t.id() === id)
        this.storeArray.splice(idx, 1)

        if (this.storeArray.length <= idx) {
            idx = 0
        }
        if (this._current?.id() === id) {
            this.setCurrent(this.storeArray[idx])
        }
    }

    private setInitCurrent(t?: T): void {
        if (t && this.storeMap.has(t.id())) {
            this.setCurrent(t)
            return
        }
        if (this.storeArray.length > 0) {
            this.setCurrent(this.storeArray[0])
        }
    }

    apply(ts: T[], t?: T): void {
        this.clear()
        ts.forEach(t => {
            this.add(t)
        })
        this.setInitCurrent(t)
    }

    clear(): void {
        this.storeMap.clear()
        this.storeArray = []
        this._current = null
    }

    add(t: T): void {
        if (t.id() === "") {
            warn("the item must have a id")
            return
        }
        if (this.storeMap.has(t.id())) {
            warn(`the item ${t.id()} should be add only once`)
            return
        }
        this.storeMap.set(t.id(), t)
        this.storeArray.push(t)
    }

    remove(id: string): void {
        if (!this.storeMap.has(id)) {
            return
        }
        this.removeItem(id)
    }

    all(): ReadonlyArray<Readonly<T>> {
        return this.storeArray
    }

    get(id: string): Readonly<T> | null {
        if (!this.storeMap.has(id)) {
            return null
        }
        return this.storeMap.get(id) as Readonly<T>
    }

    current(): Readonly<T> | null {
        return this._current
    }

    use(id: string): void {
        if (!this.storeMap.has(id)) {
            return
        }
        if (this.current()?.id() === id) {
            return
        }
        this.setCurrent(this.storeMap.get(id) as T)
    }

}

export default AbstractManager
