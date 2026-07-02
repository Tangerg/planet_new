package library

import (
	"crypto/sha1"
	"encoding/hex"
	"strings"
)

// Stable, deterministic ids so rescans map a file/album/artist to the same row
// (grouping survives across scans and app restarts). Short hex is enough to be
// collision-free for a personal library and keeps URLs tidy.

// trackID keys a track by its absolute path (paths are unique per file and
// case-significant on disk, so they are not lowercased).
func trackID(absPath string) string {
	return shortHash(absPath)
}

// albumID keys an album by (album-artist, album-name), case-folded so tag-case
// drift ("Radiohead" vs "radiohead") does not split an album.
func albumID(albumArtist, album string) string {
	return shortHash(fold(albumArtist) + "\x00" + fold(album))
}

// artistID keys an artist by name, case-folded.
func artistID(name string) string {
	return shortHash(fold(name))
}

func shortHash(s string) string {
	sum := sha1.Sum([]byte(s))
	return hex.EncodeToString(sum[:])[:16]
}

func fold(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}
