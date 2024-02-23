import {warn} from "../../shared-utils/debug";
import {IManageable, IManager, IUseableManager} from "../core";

export abstract class AbstractManager<T extends IManageable> implements IManager<T> {
    private storeArray: T[]
    private readonly storeMap: Map<string, T>


    protected constructor() {
        this.storeArray = []
        this.storeMap = new Map<string, T>()
    }


    private addItem(t: T): void {
        this.storeMap.set(t.id, t)
        this.storeArray.push(t)
    }


    protected removeItem(id: string): number {
        if (this.storeArray.length == 1) {
            this.clear()
            return 0
        }

        this.storeMap.delete(id)
        let idx = this.storeArray.findIndex((t) => t.id === id)
        this.storeArray.splice(idx, 1)

        return idx
    }

    apply(ts: T[], t?: T | undefined | null): void {
        this.clear()
        ts.forEach(t => {
            this.add(t)
        })
    }

    clear(): void {
        this.storeMap.clear()
        this.storeArray = []
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
        this.addItem(t)
    }

    remove(id: string): void {
        if (!this.has(id)) {
            return
        }
        this.removeItem(id)
    }

    all(): ReadonlyArray<Readonly<T>> {
        return this.storeArray
    }

    get(id: string): Readonly<T> | null {
        if (!this.has(id)) {
            return null
        }
        return assert(this.storeMap.get(id))
    }

    has(id: string): boolean {
        return this.storeMap.has(id)
    }

    get size(): number {
        return this.storeArray.length
    }
}

export abstract class AbstractUseableManager<T extends IManageable> extends AbstractManager<T> implements IUseableManager<T> {
    private _current: T | null
    private readonly covering: "head" | "tail"

    protected constructor(covering: "head" | "tail" = "tail") {
        super();
        this._current = null
        this.covering = covering
    }

    private setInitCurrent(t?: T | undefined | null): void {
        if (t && this.has(t.id)) {
            this.use(t.id)
            return
        }
        if (this.size > 0) {
            this.use(this.all()[0].id)
        }
    }

    protected removeItem(id: string): number {

        let idx = super.removeItem(id);

        if (this.current()?.id !== id) {
            return idx
        }

        if (this.size <= idx) {
            if (this.covering === "head") {
                idx = 0
            } else if (this.covering === "tail") {
                idx = this.size - 1
            } else {
                idx = this.size - 1
            }
        }
        this.use(this.all()[idx].id)
        return idx
    }


    apply(ts: T[], t?: T | undefined | null) {
        super.apply(ts, t);
        this.setInitCurrent(t)
    }

    clear(): void {
        super.clear()
        this._current = null
    }

    current(): Readonly<T> | null {
        return this._current
    }

    use(id: string): void {
        if (!this.has(id)) {
            return
        }
        if (this.current()?.id === id) {
            return
        }
        this._current = this.get(id)
    }
}

export default AbstractUseableManager
