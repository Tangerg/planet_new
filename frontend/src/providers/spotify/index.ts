/**
 * Spotify provider — public surface. The provider class, its raw API types, and
 * field mapper live in this folder; only the provider class is exposed. The
 * composition root constructs it via the `@providers` barrel and talks to it
 * through the `MusicProvider` port.
 */
export { Spotify } from "./Spotify";
