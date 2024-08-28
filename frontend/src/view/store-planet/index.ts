import {Plugin} from "../../packages/core";
import {PlayQueue} from "../../packages/model/playqueue";
import {useStore as useQueueStore} from "../store/playqueue";

class Store extends Plugin {
    private static readonly id: string = "store-planet";
    get id(): string {
        return Store.id;
    }

    dispose(): void {
        throw new Error("Method not implemented.");
    }

    afterInstall() {
        super.afterInstall();
        this.context.hooks.on("play_queue_changed", this.onPlayQueueChanged, this)
    }

    private onPlayQueueChanged(queue: PlayQueue) {
        useQueueStore.setState((state) => {
            return {
                ...state,
                tracks: queue.tracks!,
            }
        });
    }

}

export default Store
