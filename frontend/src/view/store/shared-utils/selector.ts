import {StoreApi, UseBoundStore} from 'zustand';

export interface StoreWithSelectors<S extends object> extends UseBoundStore<StoreApi<S>> {
    selectors: {
        [K in keyof S]: () => S[K];
    };
}

export function createStoreWithSelectors<S extends object>(_store: UseBoundStore<StoreApi<S>>): StoreWithSelectors<S> {
    const store = _store as any;
    store.selectors = {};
    Object.keys(store.getState()).forEach((key) => {
        const selector = (state: S) => state[key as keyof S];
        store.selectors[key] = () => store(selector);
    });
    return store as StoreWithSelectors<S>;
}

export default createStoreWithSelectors
