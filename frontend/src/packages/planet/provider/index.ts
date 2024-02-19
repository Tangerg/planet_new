import {Track} from "../model/track";
import {warn} from "../../shared-utils/debug";


export interface IProvider {
    platform(): string

    playlist(id: string): Promise<Track[]>
}

export interface IProvidersManager {
    applyProviders(ps: IProvider[], p?: IProvider): void

    clearProviders(): void

    addProvider(p: IProvider): void

    removeProvider(name: string): void

    getProviders(): Readonly<Readonly<IProvider>[]>

    getProvider(): Readonly<IProvider> | null

    useProvider(name: string): void
}

export class ProvidersManager implements IProvidersManager {
    private providers: IProvider[] = []
    private readonly providersMap: Map<string, IProvider> = new Map<string, IProvider>
    private currentProvider: IProvider | null = null

    constructor(ps?: IProvider[], p?: IProvider) {
        if (ps && ps.length > 0) {
            this.applyProviders(ps, p)
        }
    }


    private _removeProvider(name: string): void {
        this.providersMap.delete(name)
        const idx = this.providers.findIndex((p) => p.platform() === name)
        this.providers.splice(idx, 1)
        if (this.currentProvider?.platform() === name) {
            this.currentProvider = this.providers[0]
        }
    }

    private _useProviderOrDefault(name: string): void {
        if (this.providersMap.has(name)) {
            this.useProvider(name)
            return
        }

        if (this.providers.length > 0) {
            this.useProvider(this.providers[0].platform())
        }
    }

    clearProviders(): void {
        this.currentProvider = null
        this.providersMap.clear()
        this.providers = []
    }

    applyProviders(ps: IProvider[], p?: IProvider): void {
        this.clearProviders()
        ps.forEach(provider => {
            this.addProvider(provider)
        })
        const name = p ? p.platform() : ""
        this._useProviderOrDefault(name)
    }

    getProviders(): readonly Readonly<IProvider>[] {
        return this.providers
    }


    addProvider(provider: IProvider): void {
        if (provider.platform() === "") {
            warn("the provider must have platform")
            return;
        }
        if (this.providersMap.has(provider.platform())) {
            return
        }
        this.providersMap.set(provider.platform(), provider)
        this.providers.push(provider)
    }


    removeProvider(name: string): void {
        if (!this.providersMap.has(name)) {
            return
        }
        if (this.providersMap.size === 1) {
            this.clearProviders()
            return
        }
        this._removeProvider(name)
    }

    getProvider(): Readonly<IProvider> | null {
        return this.currentProvider
    }

    useProvider(name: string): void {
        if (!this.providersMap.has(name)) {
            return
        }
        if (this.currentProvider?.platform() === name) {
            return
        }
        this.currentProvider = this.providersMap.get(name) as IProvider
    }

}

export default ProvidersManager
