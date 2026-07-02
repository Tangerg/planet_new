/**
 * NeteaseCloudMusic provider — public surface. Everything NCM (the provider
 * class, its per-capability request submodules, raw types, and field mapper)
 * lives in this folder; only the provider class is exposed. The composition root
 * constructs it via the `@providers` barrel and talks to it through the
 * `MusicProvider` port — nothing outside reaches into the submodules or mapper.
 */
export { NeteaseCloudMusic } from "./NeteaseCloudMusic";
