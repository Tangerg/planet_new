package domain

import "context"

// Catalog is the persistence port for the scanned library. Infrastructure
// (SQLite) implements it; the application layer depends on this interface, not
// the implementation, so reads can be driven off a fake in tests.
//
// Reads return domain entities without any transport concern (no URLs): the
// application layer builds media/cover URLs when projecting to the wire.
type Catalog interface {
	// Save indexes one folder's scan in a single unit of work. Metadata is always
	// upserted, but missing rows are pruned only when the snapshot is complete;
	// a partial filesystem observation has no authority to declare files gone.
	Save(ctx context.Context, folder string, scan ScanSnapshot, at int64) (added, total int, err error)

	Count(ctx context.Context) (int, error)
	Albums(ctx context.Context) ([]Album, error)
	Artists(ctx context.Context) ([]Artist, error)
	Album(ctx context.Context, id AlbumID) (*Album, error)
	Artist(ctx context.Context, id ArtistID) (*Artist, error)
	AlbumsByArtist(ctx context.Context, id ArtistID) ([]Album, error)
	AllTracks(ctx context.Context) ([]Track, error)
	RecentTracks(ctx context.Context, limit int) ([]Track, error)
	Tracks(ctx context.Context, ids []TrackID) ([]Track, error)
	TracksByAlbum(ctx context.Context, id AlbumID) ([]Track, error)
	TracksByArtist(ctx context.Context, id ArtistID) ([]Track, error)
	Search(ctx context.Context, query string, limit int) (SearchResult, error)
	// TrackPath is the on-disk location of a track's audio file — used to reach
	// files that live next to it (sidecar lyrics), not returned to the frontend.
	TrackPath(ctx context.Context, id TrackID) (string, error)
}

// LyricReader reads the lyrics that live alongside a track's audio file (a
// sidecar .lrc), given that file's path. Infrastructure (filesystem) implements
// it. Returns "" (no error) when the track has no sidecar lyric, so a missing
// file is a normal "no lyrics" result rather than a failure.
type LyricReader interface {
	Lyric(ctx context.Context, audioPath string) (string, error)
}

// Scanner is the folder-scan port: walk a directory and read each audio file's
// tags into normalized metadata. Infrastructure (filesystem + tag reader)
// implements it.
type Scanner interface {
	// Scan returns the files it could inspect plus whether the observation is
	// complete. Root failure/cancellation returns an error and no snapshot;
	// recoverable subtree failures return a partial snapshot without an error.
	Scan(ctx context.Context, root string) (ScanSnapshot, error)
}
