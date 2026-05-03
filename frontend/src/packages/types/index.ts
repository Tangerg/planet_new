export interface IIDable {
    get id(): string
}

export interface IDisposable {
    dispose(): void
}

export interface IClearable {
    clear(): void;
}
