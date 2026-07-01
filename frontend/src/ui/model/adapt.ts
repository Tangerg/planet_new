/**
 * Backward-compatible presentation projection surface.
 *
 * The Vibe display models live in `vibe.ts`; entity-specific domain -> UI
 * adapters live in `adapters/*`. Keep this file as the stable import surface
 * while the implementation stays split by music-domain concept.
 */
export * from "@/model/vibe";
export * from "@/model/adapters/track";
export * from "@/model/adapters/collection";
export * from "@/model/adapters/artist";
export * from "@/model/adapters/music-video";
export * from "@/model/adapters/comment";
