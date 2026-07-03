package domain

// Catalog is the persistence port for the scanned library. Infrastructure
// (SQLite) implements it; the application layer depends on this interface, not
// the implementation, so reads can be driven off a fake in tests.
//
// Reads return domain entities without any transport concern (no URLs): the
// application layer builds media/cover URLs when projecting to the wire.
type Catalog interface {
	// Save indexes one folder's scanned files in a single unit of work: upsert
	// the derived entities, prune rows for files that vanished from that folder
	// since the last scan, then drop orphaned albums/artists. Returns the count
	// newly added this scan and the total afterwards.
	Save(folder string, metas []TrackMetadata, at int64) (added, total int, err error)

	Count() (int, error)
	Albums() ([]Album, error)
	Artists() ([]Artist, error)
	Album(id AlbumID) (*Album, error)
	Artist(id ArtistID) (*Artist, error)
	AlbumsByArtist(id ArtistID) ([]Album, error)
	AllTracks() ([]Track, error)
	RecentTracks(limit int) ([]Track, error)
	Tracks(ids []TrackID) ([]Track, error)
	TracksByAlbum(id AlbumID) ([]Track, error)
	TracksByArtist(id ArtistID) ([]Track, error)
	Search(query string, limit int) (SearchResult, error)
}

// Scanner is the folder-scan port: walk a directory and read each audio file's
// tags into normalized metadata. Infrastructure (filesystem + tag reader)
// implements it.
type Scanner interface {
	// Scan returns metadata for every audio file under root, plus how many audio
	// files were seen (for scan reporting).
	Scan(root string) (metas []TrackMetadata, filesSeen int, err error)
}
