import type { library } from "@wailsjs/go/models";

/**
 * Raw entity DTOs from the Go `library` service, aliased so the mapper (the only
 * consumer) references the wailsjs-generated types from one place. Composite
 * responses (AlbumDetail / Home / SearchResult / ScanResult) are consumed via
 * their bridge functions' inferred return types, so they need no alias here.
 */
export type LocalTrack = library.Track;
export type LocalAlbum = library.Album;
export type LocalArtist = library.Artist;
