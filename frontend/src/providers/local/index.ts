/**
 * Local provider — public surface. The provider class, its raw bridge DTO types,
 * and field mapper live in this folder; only the provider class is exposed. The
 * composition root constructs it via the `@providers` barrel and talks to it
 * through the `MusicProvider` port.
 */
export { LocalMusic } from "./LocalMusic";
