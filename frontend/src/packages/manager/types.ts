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
