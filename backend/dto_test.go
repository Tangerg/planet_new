package backend

import (
	"testing"

	"changeme/backend/domain"
)

func TestMediaURLsProjectLoopbackURLs(t *testing.T) {
	u := mediaURLs{base: "http://127.0.0.1:9999"}

	track := u.track(domain.Track{ID: "trk1", AlbumID: "alb1", Duration: 1000, Cover: domain.Cover{Album: "alb1"}})
	if track.PlayURL != "http://127.0.0.1:9999/media/trk1" {
		t.Errorf("track playURL = %q", track.PlayURL)
	}
	// A remote CDN URL is wrapped (and query-escaped) in the /stream byte-proxy.
	if u.stream("https://cdn.example/song.mp3?br=320000") != "http://127.0.0.1:9999/stream?url=https%3A%2F%2Fcdn.example%2Fsong.mp3%3Fbr%3D320000" {
		t.Errorf("stream URL was not escaped correctly")
	}
	if u.stream("") != "" {
		t.Error("empty stream URL should stay empty")
	}
	// Idempotent: an already-loopback URL (our own /media) is not double-proxied.
	if got := u.stream(track.PlayURL); got != track.PlayURL {
		t.Errorf("stream(%q) = %q, want it returned unchanged", track.PlayURL, got)
	}
	if track.CoverURL != "http://127.0.0.1:9999/cover/alb1" {
		t.Errorf("track coverURL = %q", track.CoverURL)
	}
	if track.DurationMs != 1000 {
		t.Errorf("durationMs = %d, want 1000", track.DurationMs)
	}

	// No album art → empty cover URL (never a dangling /cover/).
	noArt := u.track(domain.Track{ID: "trk2", AlbumID: "alb2"})
	if noArt.CoverURL != "" {
		t.Errorf("track with no art coverURL = %q, want empty", noArt.CoverURL)
	}

	// An artist borrows a specific album's art.
	artist := u.artist(domain.Artist{ID: "art1", Cover: domain.Cover{Album: "alb9"}})
	if artist.CoverURL != "http://127.0.0.1:9999/cover/alb9" {
		t.Errorf("artist coverURL = %q, want its cover album", artist.CoverURL)
	}
	if u.artist(domain.Artist{ID: "art2"}).CoverURL != "" {
		t.Error("artist with no art should have empty coverURL")
	}
}
