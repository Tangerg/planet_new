package domain

import "testing"

func TestMetadataNormalizesIdentityAndDisplay(t *testing.T) {
	m := TrackMetadata{
		Path:        "/music/a/03 - Song.mp3",
		Title:       "Song",
		Album:       "The Album",
		AlbumArtist: "Band",
		Artist:      "Band feat. Guest",
		TrackNo:     3,
		Duration:    240000,
		CoverExt:    "jpg",
	}

	// Album/artist group by the album-artist; the track row shows the performer.
	if got := m.ToArtist().Name; got != "Band" {
		t.Errorf("artist name = %q, want album-artist Band", got)
	}
	if got := m.ToAlbum().Artist; got != "Band" {
		t.Errorf("album artist = %q, want Band", got)
	}
	if got := m.ToTrack().Artist; got != "Band feat. Guest" {
		t.Errorf("track display artist = %q, want the performing credit", got)
	}

	// Identity is consistent across the derived entities.
	track := m.ToTrack()
	if track.AlbumID != m.ToAlbum().ID || track.ArtistID != m.ToArtist().ID {
		t.Error("track ids do not match its album/artist entities")
	}
	if !track.Cover.Present() || track.Cover.Album != track.AlbumID {
		t.Error("track cover should point at its own album when art exists")
	}
}

func TestMetadataFallbacksForMissingTags(t *testing.T) {
	m := TrackMetadata{Path: "/music/loose/mystery.flac"} // no tags at all

	track := m.ToTrack()
	if track.Title != "mystery" {
		t.Errorf("title = %q, want filename fallback 'mystery'", track.Title)
	}
	if m.ToAlbum().Name != "Unknown Album" || m.ToArtist().Name != "Unknown Artist" {
		t.Error("missing album/artist should fall back to the Unknown buckets")
	}
	if track.Cover.Present() {
		t.Error("no CoverExt → no cover")
	}
	// The Unknown buckets are stable (same id every scan).
	if m.ToArtist().ID != NewArtistID("Unknown Artist") {
		t.Error("Unknown Artist bucket id is not stable")
	}
}
