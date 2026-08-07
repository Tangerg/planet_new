import type { Album, Artist, Track } from "@bindings/github.com/Tangerg/planet_new/backend";

/**
 * Raw entity DTOs from the Go `library` service, aliased so the mapper (the only
 * consumer) references the Wails-generated types from one place. Composite
 * responses (AlbumDetail / Home / SearchResult / ScanResult) are consumed via
 * their bridge functions' inferred return types, so they need no alias here.
 */
export type LocalTrack = Track;
export type LocalAlbum = Album;
export type LocalArtist = Artist;
