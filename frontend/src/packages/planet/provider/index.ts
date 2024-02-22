import {Track} from "../model/track";
import {warn} from "../../shared-utils/debug";


export interface IProvider {
    name(): string

    playlist(id: string): Promise<Track[]>
}

export interface IProvidersManager {
    apply(ps: IProvider[], p?: IProvider): void

    clear(): void

    add(p: IProvider): void

    remove(name: string): void

    all(): ReadonlyArray<Readonly<IProvider>>

    get(name: string): Readonly<IProvider> | null

    current(): Readonly<IProvider> | null

    use(name: string): void
}

export class ProvidersManager implements IProvidersManager {
    private providers: IProvider[]
    private readonly providersMap: Map<string, IProvider>
    private currentProvider: IProvider | null

    constructor(ps?: IProvider[], p?: IProvider) {
        this.providers = []
        this.providersMap = new Map<string, IProvider>()
        this.currentProvider = null

        if (ps && ps.length > 0) {
            this.apply(ps, p)
        }
    }


    private removeProvider(name: string): void {
        this.providersMap.delete(name)
        const idx = this.providers.findIndex((p) => p.name() === name)
        this.providers.splice(idx, 1)
        if (this.currentProvider?.name() === name) {
            this.currentProvider = this.providers[0]
        }
    }

    private setInitProvider(provider?: IProvider): void {
        if (provider && this.providersMap.has(provider.name())) {
            this.use(provider.name())
            return
        }
        if (this.providers.length > 0) {
            this.use(this.providers[0].name())
        }
    }

    clear(): void {
        this.currentProvider = null
        this.providersMap.clear()
        this.providers = []
    }

    apply(ps: IProvider[], p?: IProvider): void {
        this.clear()
        ps.forEach(provider => {
            this.add(provider)
        })
        this.setInitProvider(p)
    }


    add(provider: IProvider): void {
        if (provider.name() === "") {
            warn("the provider must have a name")
            return;
        }
        if (this.providersMap.has(provider.name())) {
            warn(`the provider ${provider.name()} should be add only once`)
            return
        }
        this.providersMap.set(provider.name(), provider)
        this.providers.push(provider)
    }


    remove(name: string): void {
        if (!this.providersMap.has(name)) {
            return
        }
        if (this.providersMap.size === 1) {
            this.clear()
            return
        }
        this.removeProvider(name)
    }

    all(): ReadonlyArray<Readonly<IProvider>> {
        return this.providers
    }

    get(name: string): Readonly<IProvider> | null {
        if (!this.providersMap.has(name)) {
            return null
        }
        return this.providersMap.get(name) as Readonly<IProvider>
    }

    current(): Readonly<IProvider> | null {
        return this.currentProvider
    }

    use(name: string): void {
        if (!this.providersMap.has(name)) {
            return
        }
        if (this.currentProvider?.name() === name) {
            return
        }
        this.currentProvider = this.providersMap.get(name) as Readonly<IProvider>
    }

}

export default ProvidersManager
