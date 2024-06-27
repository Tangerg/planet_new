import {IClearable, IIDable} from "../types";

export interface IManageable extends IIDable {
}

export interface IManager<T extends IManageable> extends IClearable {
    apply(ts: T[]): void

    add(t: T): void

    remove(id: string): void

    all(): ReadonlyArray<Readonly<T>>

    get(id: string): Readonly<T> | null

    has(id: string): boolean

    get size(): number
}

export interface IUseableManager<T extends IManageable> extends IManager<T> {
    apply(ts: T[], t?: T): void

    get current(): Readonly<T> | null

    use(id: string): void
}
