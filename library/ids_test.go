package library

import (
	"regexp"
	"testing"
)

func TestIDsAreShortHex(t *testing.T) {
	hex16 := regexp.MustCompile(`^[0-9a-f]{16}$`)
	for _, id := range []string{trackID("/a/b.mp3"), albumID("X", "Y"), artistID("Z")} {
		if !hex16.MatchString(id) {
			t.Fatalf("id %q is not 16 hex chars (media server rejects non-hex ids)", id)
		}
	}
}

func TestAlbumAndArtistIDsFoldCaseAndSpace(t *testing.T) {
	if albumID("Radiohead", "OK Computer") != albumID("radiohead", "  ok computer  ") {
		t.Error("album id should be case/space-insensitive so tag drift does not split an album")
	}
	if artistID("Björk") != artistID("  björk ") {
		t.Error("artist id should fold case/space")
	}
	if albumID("A", "One") == albumID("A", "Two") {
		t.Error("different albums by the same artist must have different ids")
	}
}

func TestTrackIDIsPathSensitive(t *testing.T) {
	if trackID("/music/a.mp3") == trackID("/music/b.mp3") {
		t.Error("distinct paths must yield distinct track ids")
	}
	// Paths are case-significant on disk, so ids are not folded.
	if trackID("/Music/A.mp3") == trackID("/music/a.mp3") {
		t.Error("track id should not fold path case")
	}
}
