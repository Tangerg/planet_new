export interface IIDable {
    get id(): string
}

export interface IDisposeable {
    dispose(): void
}

export interface IClearable {
    clear(): void;
}

