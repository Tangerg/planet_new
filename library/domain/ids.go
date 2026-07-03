package domain

import (
	"crypto/sha1"
	"encoding/hex"
	"strings"
)

// Identity value objects. Ids are stable, deterministic 16-hex strings so a
// rescan maps the same file/album/artist to the same row (grouping survives
// restarts) and the media server can validate ids by shape.

type (
	TrackID  string
	AlbumID  string
	ArtistID string
)

func (id TrackID) String() string  { return string(id) }
func (id AlbumID) String() string  { return string(id) }
func (id ArtistID) String() string { return string(id) }

// NewTrackID keys a track by its absolute path — unique per file and
// case-significant on disk, so it is not folded.
func NewTrackID(absPath string) TrackID { return TrackID(shortHash(absPath)) }

// NewAlbumID keys an album by (album-artist, name), case/space-folded so tag
// drift ("Radiohead" vs "radiohead") does not split one album into two.
func NewAlbumID(albumArtist, album string) AlbumID {
	return AlbumID(shortHash(fold(albumArtist) + "\x00" + fold(album)))
}

// NewArtistID keys an artist by name, case/space-folded.
func NewArtistID(name string) ArtistID { return ArtistID(shortHash(fold(name))) }

func shortHash(s string) string {
	sum := sha1.Sum([]byte(s))
	return hex.EncodeToString(sum[:])[:16]
}

func fold(s string) string { return strings.ToLower(strings.TrimSpace(s)) }
