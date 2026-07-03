package domain

// Duration is a playback length in milliseconds — a typed value object so the
// unit can't be confused with seconds at a boundary.
type Duration int

// Millis returns the length in milliseconds.
func (d Duration) Millis() int { return int(d) }

// Cover identifies which album's art represents an entity. The zero value means
// "no art". Track/Album cover to their own album; an Artist borrows its newest
// album's art. Keeping only the album id (not the file extension) means every
// cover URL is built the same way: `/cover/<albumId>`.
type Cover struct {
	Album AlbumID
}

// Present reports whether any art backs this cover.
func (c Cover) Present() bool { return c.Album != "" }
