import {create} from "zustand";
import createSelectors from "../shared-utils/selector";

type State = {
    isQueueOpen: boolean,
}
type Action = {
    setIsQueueOpen: (isQueueOpen: boolean) => void,
}
type Store = State & Action

const initialState: State = {
    isQueueOpen: false,
}

const useStore = create<Store>((set) => ({
    ...initialState,
    setIsQueueOpen: (isQueueOpen: boolean) => set(state => ({
        ...state,
        isQueueOpen: isQueueOpen,
    })),
}))

const useAppStore = createSelectors(useStore)
export default useAppStore

export const queueOpenSelector = (state: Store): [boolean, (v: boolean) => void] => {
    return [state.isQueueOpen, state.setIsQueueOpen];
}