import { Plugin } from "../../kernel";
import { Queue } from "./queue";
import { Track } from "@domain/model/track";
import { PlayQueue as PlayQueueModel } from "@domain/model/playqueue";
import { shuffleArray } from "@shared/array";
import { Repeat, RepeatMode } from "./repeat";

declare module "../../kernel/event" {
  interface PlanetEventMap {
    change_play_queue: PlayQueueModel;
    play_queue_changed: PlayQueueModel;
    next_track: never;
    previous_track: never;
    select_track: Track;
    current_track_changed: Track;
    clean_play_queue: never;
    play_queue_cleaned: never;
    change_repeat_mode: never;
    repeat_mode_changed: RepeatMode;
    change_shuffle_enable: never;
    shuffle_enable_changed: boolean;
  }
}

export class PlayQueue extends Plugin {
  public static readonly id = "PlayQueue";
  private readonly playQueue: Queue;
  private readonly displayQueue: Queue;
  private readonly repeat: Repeat;
  private shuffleEnable: boolean = false;
  private playQueueKey: string = "";

  constructor() {
    super();
    this.displayQueue = new Queue();
    this.playQueue = new Queue();
    this.repeat = new Repeat();
  }

  get id(): string {
    return PlayQueue.id;
  }

  protected onDispose(): void {
    this.clear();

    this.displayQueue.off("tracks_changed", this.tracksChanged);
    this.displayQueue.off("tracks_cleaned", this.tracksCleaned);
    this.displayQueue.off("current_track_changed", this.currentTrackChanged);

    this.context.hooks.off("change_play_queue", this.apply);
    this.context.hooks.off("change_repeat_mode", this.changeRepeatMode);
    this.context.hooks.off("change_shuffle_enable", this.changeShuffleEnable);
    this.context.hooks.off("play_track_ended", this.autoNext);
  }

  protected onInit(): void {
    this.displayQueue.on("tracks_changed", this.tracksChanged, this);
    this.displayQueue.on("tracks_cleaned", this.tracksCleaned, this);
    this.displayQueue.on("current_track_changed", this.currentTrackChanged, this);

    this.context.hooks.on("change_play_queue", this.apply, this);
    this.context.hooks.on("change_repeat_mode", this.changeRepeatMode, this);
    this.context.hooks.on("change_shuffle_enable", this.changeShuffleEnable, this);
    this.context.hooks.on("next_track", this.next, this);
    this.context.hooks.on("previous_track", this.previous, this);
    this.context.hooks.on("select_track", this.select, this);
    this.context.hooks.on("play_track_ended", this.autoNext, this);
  }

  changeRepeatMode(): void {
    this.context.hooks.emit("repeat_mode_changed", this.repeat.next());
  }

  changeShuffleEnable(): void {
    this.shuffleEnable = !this.shuffleEnable;
    if (!this.displayQueue.size || !this.displayQueue.current) {
      this.context.hooks.emit("shuffle_enable_changed", this.shuffleEnable);
      return;
    }
    const playTracks = this.shuffleEnable
      ? shuffleArray(this.displayQueue.tracks)
      : this.displayQueue.tracks;
    this.playQueue.apply(playTracks);
    this.playQueue.select(this.displayQueue.current);
    this.context.hooks.emit("shuffle_enable_changed", this.shuffleEnable);
  }

  tracksChanged() {
    this.context.hooks.emit("play_queue_changed", {
      tracks: this.displayQueue.tracks,
    });
  }

  tracksCleaned(): void {
    this.context.hooks.emit("play_queue_cleaned");
  }

  currentTrackChanged() {
    this.context.hooks.emit("current_track_changed", this.displayQueue.current);
  }

  clear(): void {
    this.playQueueKey = "";
    this.playQueue.clear();
    this.displayQueue.clear();
  }

  apply(queue: PlayQueueModel): void {
    this.clear();

    this.playQueueKey = queue.key ? queue.key : this.playQueueKey;
    const tracks = queue.tracks ?? [];
    const playTracks = this.shuffleEnable ? shuffleArray(tracks) : tracks;
    this.playQueue.apply(playTracks);

    let playTrack = tracks[0];
    if (queue.track && this.playQueue.has(queue.track)) {
      playTrack = queue.track;
    }

    this.playQueue.select(playTrack);
    this.displayQueue.apply(tracks);
    this.displayQueue.select(this.playQueue.current!);
  }

  add(queue: PlayQueueModel): void {
    if (!this.playQueue.size) {
      this.playQueueKey = queue.key ? queue.key : this.playQueueKey;
    }
    this.playQueue.add(queue.track!);
    this.displayQueue.add(queue.track!);
  }

  remove(track: Track): void {
    this.playQueue.remove(track);
    this.displayQueue.remove(track);
  }

  autoNext() {
    if (this.repeat.current === RepeatMode.ONE) {
      this.context.hooks.emit("current_track_changed", this.displayQueue.current);
      return;
    }
    if (this.playQueue.isLast && this.repeat.current === RepeatMode.OFF) {
      return;
    }
    this.next();
  }

  next() {
    this.playQueue.next();
    this.displayQueue.select(this.playQueue.current!);
  }

  previous() {
    this.playQueue.previous();
    this.displayQueue.select(this.playQueue.current!);
  }

  select(track: Track): void {
    this.playQueue.select(track);
    this.displayQueue.select(this.playQueue.current!);
  }
}
