/** @domain public surface: domain ports (the MusicProvider contract) + domain
 *  models (entities / value objects). Models are also importable by subpath:
 *  @domain/model/<entity>. */
export * from "./ports/provider";
export * from "./model/track";
export * from "./model/album";
export * from "./model/artist";
export * from "./model/playlist";
export * from "./model/user";
export * from "./model/duration";
export * from "./model/lyric";
export * from "./model/personalized";
export * from "./model/playqueue";
export * from "./model/search";
export * from "./model/chart";
