import {IManageable, IManager} from "./types";
import {warn} from "@shared/debug";

export class Manager<T extends IManageable> implements IManager<T> {
    protected readonly store: Map<string, T>


    constructor() {
        this.store = new Map<string, T>()
    }

    apply(ts: T[]): void {
        this.clear()
        ts.forEach(t => {
            this.add(t)
        })
    }

    add(t: T): void {
        if (t.id === "") {
            warn("the item must have an id")
            return
        }
        if (this.has(t.id)) {
            warn(`the item ${t.id} should be add only once`)
            return
        }
        this.store.set(t.id, t)
    }

    remove(id: string): void {
        this.store.delete(id)
    }

    all(): ReadonlyArray<Readonly<T>> {
        return Array.from(this.store.values())
    }

    get(id: string): Readonly<T> | null {
        const t = this.store.get(id)
        if (!t) {
            return null
        }
        return t
    }

    has(id: string): boolean {
        return this.store.has(id)
    }

    get size(): number {
        return this.store.size
    }

    clear(): void {
        this.store.clear()
    }
}

export default Manager