import Manager from "./manager";
import {IManageable, IUseableManager} from "./types";
import {getRandomIntExclude} from "../shared-utils/math";

type UseableManagerSubstituteRule = "previous" | "next" | "random"
type UseableManagerOption = {
    substituteRule: UseableManagerSubstituteRule
}

export class UseableManager<T extends IManageable> extends Manager<T> implements IUseableManager<T> {
    private option: UseableManagerOption;
    private currentItem: T | null
    private substituteFuncs: Map<UseableManagerSubstituteRule, (ids: string[], delIdx: number) => string>

    private static substituteRulePrevious(ids: string[], delIdx: number): string {
        if (delIdx === 0) {
            return ids[ids.length - 1]
        }
        return ids[delIdx - 1]
    }

    private static substituteRuleNext(ids: string[], delIdx: number): string {
        if (delIdx === ids.length - 1) {
            return ids[0]
        }
        return ids[delIdx + 1]
    }

    private static substituteRuleRandom(ids: string[], delIdx: number): string {
        const random = getRandomIntExclude(0, ids.length, delIdx)
        return ids[random]
    }

    constructor(opt: UseableManagerOption = {substituteRule: "next"}) {
        super();
        this.option = opt
        this.currentItem = null
        this.substituteFuncs = new Map<UseableManagerSubstituteRule, (ids: string[], delIdx: number) => string>()
        this.substituteFuncs.set("previous", UseableManager.substituteRulePrevious)
        this.substituteFuncs.set("next", UseableManager.substituteRuleNext)
        this.substituteFuncs.set("random", UseableManager.substituteRuleRandom)
    }


    private removeBySubstituteRule(id: string): void {
        const ids = Array.from(this.store.keys())
        this.store.delete(id)
        if (this.current?.id !== id) {
            return;
        }
        const func = this.substituteFuncs.get(this.option.substituteRule)
        if (!func) {
            return
        }
        const delIdx = ids.findIndex((value) => {
            return value === id
        })
        this.use(func(ids, delIdx))
    }

    remove(id: string): void {
        if (!this.has(id)) {
            return;
        }
        if (this.size == 1) {
            this.clear()
            return;
        }
        return this.removeBySubstituteRule(id)
    }

    private initCurrentItem(t?: T): void {
        if (t && this.has(t.id)) {
            this.use(t.id)
            return
        }
        if (this.size > 0) {
            this.use(this.all()[0].id)
        }
    }

    apply(ts: T[], t?: T): void {
        super.apply(ts)
        this.initCurrentItem(t)
    }

    get current(): Readonly<T> | null {
        return this.currentItem;
    }

    use(id: string): void {
        if (!this.has(id)) {
            return;
        }
        if (this.current?.id === id) {
            return
        }
        this.currentItem = this.get(id)
    }

    clear() {
        super.clear();
        this.currentItem = null
    }
}

export default UseableManager
