package domain

import (
	"errors"
	"regexp"
	"testing"
)

func TestIDsAreShortHex(t *testing.T) {
	hex16 := regexp.MustCompile(`^[0-9a-f]{16}$`)
	ids := []string{
		NewTrackID("/a/b.mp3").String(),
		NewAlbumID("X", "Y").String(),
		NewArtistID("Z").String(),
	}
	for _, id := range ids {
		if !hex16.MatchString(id) {
			t.Errorf("id %q is not 16 hex chars (media server rejects non-hex ids)", id)
		}
	}
}

func TestAlbumAndArtistIDsFoldCaseAndSpace(t *testing.T) {
	if NewAlbumID("Radiohead", "OK Computer") != NewAlbumID("radiohead", "  ok computer  ") {
		t.Error("album id should fold case/space so tag drift does not split one album")
	}
	if NewArtistID("Björk") != NewArtistID("  björk ") {
		t.Error("artist id should fold case/space")
	}
	if NewAlbumID("A", "One") == NewAlbumID("A", "Two") {
		t.Error("different albums by the same artist must differ")
	}
}

func TestTrackIDIsPathSensitive(t *testing.T) {
	if NewTrackID("/music/a.mp3") == NewTrackID("/music/b.mp3") {
		t.Error("distinct paths must yield distinct track ids")
	}
	if NewTrackID("/Music/A.mp3") == NewTrackID("/music/a.mp3") {
		t.Error("track id should not fold path case")
	}
}

func TestParseIDsEnforcesTheSharedEncodedShape(t *testing.T) {
	type parseFunc func(string) (string, error)
	parsers := []struct {
		name  string
		parse parseFunc
	}{
		{name: "track", parse: func(value string) (string, error) {
			id, err := ParseTrackID(value)
			return id.String(), err
		}},
		{name: "album", parse: func(value string) (string, error) {
			id, err := ParseAlbumID(value)
			return id.String(), err
		}},
		{name: "artist", parse: func(value string) (string, error) {
			id, err := ParseArtistID(value)
			return id.String(), err
		}},
	}

	const valid = "0123456789abcdef"
	invalid := []string{"", "abc", "0123456789abcdeG", "0123456789abcdef0", " 123456789abcdef"}
	for _, parser := range parsers {
		t.Run(parser.name, func(t *testing.T) {
			got, err := parser.parse(valid)
			if err != nil || got != valid {
				t.Fatalf("parse valid id = (%q, %v), want (%q, nil)", got, err, valid)
			}
			for _, value := range invalid {
				got, err := parser.parse(value)
				if got != "" || !errors.Is(err, ErrInvalidID) {
					t.Errorf("parse invalid id %q = (%q, %v), want zero + ErrInvalidID", value, got, err)
				}
			}
		})
	}
}
