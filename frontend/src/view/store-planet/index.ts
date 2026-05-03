import { Plugin } from "../../packages/core";
import type { PlayQueue } from "../../packages/model/playqueue";
import type { Track } from "../../packages/model/track";
import type { PlayState } from "../../packages/plugin";
import type {
    FormattedDuration,
    Progress,
} from "../../packages/model/duration";
import { useStore as useQueueStore } from "../store/playqueue";

/**
 * 内核 → UI 的桥接插件：把事件派发的最新值固化到 zustand store，
 * 让任何时刻 mount 的 React 组件都能直接拿到当前态，而不必依赖订阅时机。
 *
 * 桥接的事件：
 *   - play_queue_changed       → tracks
 *   - current_track_changed    → track
 *   - play_state_changed       → playState
 *   - track_duration_changed   → duration
 *   - play_time_changed        → progress
 */
class Store extends Plugin {
    private static readonly id: string = "store-planet";

    get id(): string {
        return Store.id;
    }

    dispose(): void {
        const { hooks } = this.context;
        hooks.off("play_queue_changed", this.onPlayQueueChanged);
        hooks.off("current_track_changed", this.onCurrentTrackChanged);
        hooks.off("play_state_changed", this.onPlayStateChanged);
        hooks.off("track_duration_changed", this.onDurationChanged);
        hooks.off("play_time_changed", this.onProgressChanged);
    }

    protected onInit(): void {
        const { hooks } = this.context;
        hooks.on("play_queue_changed", this.onPlayQueueChanged, this);
        hooks.on("current_track_changed", this.onCurrentTrackChanged, this);
        hooks.on("play_state_changed", this.onPlayStateChanged, this);
        hooks.on("track_duration_changed", this.onDurationChanged, this);
        hooks.on("play_time_changed", this.onProgressChanged, this);
    }

    private onPlayQueueChanged(queue: PlayQueue) {
        useQueueStore.setState((s) => ({ ...s, tracks: queue.tracks ?? [] }));
    }

    private onCurrentTrackChanged(track: Track) {
        useQueueStore.setState((s) => ({ ...s, track }));
    }

    private onPlayStateChanged(playState: PlayState) {
        useQueueStore.setState((s) => ({ ...s, playState }));
    }

    private onDurationChanged(duration: FormattedDuration) {
        useQueueStore.setState((s) => ({ ...s, duration }));
    }

    private onProgressChanged(progress: Progress) {
        useQueueStore.setState((s) => ({ ...s, progress }));
    }
}

export default Store;
