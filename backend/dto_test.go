package backend

import (
	"testing"

	"github.com/Tangerg/planet_new/backend/domain"
)

func TestMediaURLsProjectLoopbackURLs(t *testing.T) {
	proxied := ""
	u := mediaURLs{
		base: "http://127.0.0.1:9999",
		streamProxy: func(raw string) string {
			if raw == "http://127.0.0.1:9999/media/trk1" {
				return raw
			}
			proxied = raw
			return "http://127.0.0.1:9999/stream?secured=1"
		},
	}

	track := u.track(domain.Track{ID: "trk1", AlbumID: "alb1", Duration: 1000, Cover: domain.Cover{Album: "alb1"}})
	if track.PlayURL != "http://127.0.0.1:9999/media/trk1" {
		t.Errorf("track playURL = %q", track.PlayURL)
	}
	// A remote CDN URL is delegated to the media server, which owns proxy
	// authentication and target validation.
	remote := "https://cdn.example/song.mp3?br=320000"
	if u.stream(remote) != "http://127.0.0.1:9999/stream?secured=1" || proxied != remote {
		t.Errorf("stream URL was not delegated to the secured proxy")
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

func TestMediaURLCollectionsStayNonNilForWireContract(t *testing.T) {
	u := mediaURLs{}
	if u.tracks(nil) == nil || u.albums(nil) == nil || u.artists(nil) == nil {
		t.Fatal("empty DTO collections must encode as arrays, not null")
	}
}
