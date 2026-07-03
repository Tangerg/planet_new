// Package domain is the on-device music library's core model: entities, value
// objects, the tag-normalization rules, and the ports (repository / scanner)
// that the infrastructure layer implements. It depends on nothing outward — no
// SQL, no filesystem, no Wails — so the rules live in one framework-free place.
package domain

// Track is one playable local file's catalog entry. `Artist` is the performing
// credit shown on the row (may differ from the owning album artist).
type Track struct {
	ID       TrackID
	Title    string
	AlbumID  AlbumID
	Album    string
	Cover    Cover
	ArtistID ArtistID
	Artist   string
	TrackNo  int
	DiscNo   int
	Duration Duration
	Year     int
	Genre    string
	AddedAt  int64
}

// Album groups tracks by (album-artist, name). `TrackCount` is filled by reads.
type Album struct {
	ID         AlbumID
	Name       string
	ArtistID   ArtistID
	Artist     string
	Year       int
	Cover      Cover
	TrackCount int
	AddedAt    int64
}

// HasTracks reports whether the album currently holds any tracks.
func (a Album) HasTracks() bool { return a.TrackCount > 0 }

// Artist groups albums/tracks by album-artist name. Counts + cover are filled by
// reads; the cover borrows the artist's newest album art.
type Artist struct {
	ID         ArtistID
	Name       string
	AlbumCount int
	TrackCount int
	Cover      Cover
}
