import {IIDable} from "./base";

export interface IManageable extends IIDable {
}

export interface IManager<T extends IManageable> {
    apply(ts: T[], t?: T | undefined | null): void

    clear(): void

    add(t: T): void

    remove(id: string): void

    all(): ReadonlyArray<Readonly<T>>

    get(id: string): Readonly<T> | null

    has(id: string): boolean

    get size(): number
}

export interface IUseableManager<T extends IManageable> extends IManager<T> {
    current(): Readonly<T> | null

    use(id: string): void
}
