package library

import (
	"testing"

	"changeme/library/domain"
)

// fakeCatalog is an in-memory domain.Catalog for exercising the app-layer
// projection without a database — the point of depending on the port.
type fakeCatalog struct {
	albums  []domain.Album
	artists []domain.Artist
	recent  []domain.Track
}

func (f fakeCatalog) Save(string, []domain.TrackMetadata, int64) (int, int, error) { return 0, 0, nil }
func (f fakeCatalog) Count() (int, error)                                          { return len(f.recent), nil }
func (f fakeCatalog) Albums() ([]domain.Album, error)                              { return f.albums, nil }
func (f fakeCatalog) Artists() ([]domain.Artist, error)                            { return f.artists, nil }
func (f fakeCatalog) Album(domain.AlbumID) (*domain.Album, error)                  { return nil, nil }
func (f fakeCatalog) Artist(domain.ArtistID) (*domain.Artist, error)               { return nil, nil }
func (f fakeCatalog) AlbumsByArtist(domain.ArtistID) ([]domain.Album, error)       { return f.albums, nil }
func (f fakeCatalog) AllTracks() ([]domain.Track, error)                           { return f.recent, nil }
func (f fakeCatalog) RecentTracks(int) ([]domain.Track, error)                     { return f.recent, nil }
func (f fakeCatalog) Tracks([]domain.TrackID) ([]domain.Track, error)              { return f.recent, nil }
func (f fakeCatalog) TracksByAlbum(domain.AlbumID) ([]domain.Track, error)         { return f.recent, nil }
func (f fakeCatalog) TracksByArtist(domain.ArtistID) ([]domain.Track, error)       { return f.recent, nil }
func (f fakeCatalog) Search(string, int) (domain.SearchResult, error) {
	return domain.SearchResult{Tracks: f.recent, Albums: f.albums, Artists: f.artists}, nil
}

func TestHomeProjectsEntitiesWithLoopbackURLs(t *testing.T) {
	cat := fakeCatalog{
		albums:  []domain.Album{{ID: "alb1", Name: "A", Cover: domain.Cover{Album: "alb1"}}},
		artists: []domain.Artist{{ID: "art1", Name: "X"}}, // no cover
		recent:  []domain.Track{{ID: "trk1", Title: "T", AlbumID: "alb1", Cover: domain.Cover{Album: "alb1"}}},
	}
	l := &Library{catalog: cat, urls: mediaURLs{base: "http://127.0.0.1:9999"}, ready: true}

	home, err := l.Home()
	if err != nil {
		t.Fatal(err)
	}
	if got := home.RecentTracks[0].PlayURL; got != "http://127.0.0.1:9999/media/trk1" {
		t.Errorf("track playURL = %q", got)
	}
	if got := home.RecentTracks[0].CoverURL; got != "http://127.0.0.1:9999/cover/alb1" {
		t.Errorf("track coverURL = %q", got)
	}
	if got := home.Albums[0].CoverURL; got != "http://127.0.0.1:9999/cover/alb1" {
		t.Errorf("album coverURL = %q", got)
	}
	if got := home.Artists[0].CoverURL; got != "" {
		t.Errorf("artist with no art should have empty coverURL, got %q", got)
	}
}

func TestUnreadyLibraryDegradesToEmpty(t *testing.T) {
	l := &Library{} // ready == false (DB failed to open)

	home, err := l.Home()
	if err == nil {
		t.Error("expected an error when the library is unavailable")
	}
	if home.Albums == nil || home.RecentTracks == nil {
		t.Error("degraded Home must still return non-nil slices (wire emits [])")
	}
	if _, err := l.TrackCount(); err == nil {
		t.Error("TrackCount should error when unavailable")
	}
}
