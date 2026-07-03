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
