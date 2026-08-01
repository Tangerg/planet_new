package domain

import (
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"fmt"
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

// ErrInvalidID identifies malformed local-library entity ids at trust
// boundaries. Concrete parse errors retain the entity kind and rejected value
// for internal diagnostics; outer adapters classify the sentinel without
// exposing those details to the frontend.
var ErrInvalidID = errors.New("invalid local-library entity id")

const encodedIDLength = 16

func (id TrackID) String() string  { return string(id) }
func (id AlbumID) String() string  { return string(id) }
func (id ArtistID) String() string { return string(id) }

// ParseTrackID, ParseAlbumID and ParseArtistID restore typed identities from
// untrusted wire or persistence values. All identity entry points share this
// rule so the domain and HTTP adapters cannot drift apart.
func ParseTrackID(value string) (TrackID, error)   { return parseID[TrackID]("track", value) }
func ParseAlbumID(value string) (AlbumID, error)   { return parseID[AlbumID]("album", value) }
func ParseArtistID(value string) (ArtistID, error) { return parseID[ArtistID]("artist", value) }

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

func parseID[ID ~string](kind, value string) (ID, error) {
	if len(value) != encodedIDLength {
		return "", fmt.Errorf("%w: %s %q", ErrInvalidID, kind, value)
	}
	for _, char := range value {
		if !strings.ContainsRune("0123456789abcdef", char) {
			return "", fmt.Errorf("%w: %s %q", ErrInvalidID, kind, value)
		}
	}
	return ID(value), nil
}

func fold(s string) string { return strings.ToLower(strings.TrimSpace(s)) }
