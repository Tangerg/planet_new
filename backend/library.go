package backend

import (
	"time"

	"changeme/backend/application"
	"changeme/backend/domain"
)

// Library is the Wails-bound adapter over the application service: it converts
// string ids at the JS boundary, delegates each use case to the service, and
// projects domain entities to wire DTOs (adding loopback URLs). The bound method
// signatures + DTO shapes are the frontend contract, so they stay stable.
type Library struct {
	service *application.Service
	urls    mediaURLs
}

func newLibrary(service *application.Service, urls mediaURLs) *Library {
	return &Library{service: service, urls: urls}
}

// ── scanning ─────────────────────────────────────────────────────────────────

func (l *Library) PickFolder() (string, error) { return l.service.PickFolder() }

func (l *Library) PickAndScan() (ScanResult, error) {
	start := time.Now()
	report, err := l.service.PickAndScan()
	if err != nil {
		return ScanResult{}, err
	}
	return scanResult(report, start), nil
}

func (l *Library) ScanFolder(folder string) (ScanResult, error) {
	start := time.Now()
	report, err := l.service.ScanFolder(folder)
	if err != nil {
		return ScanResult{}, err
	}
	return scanResult(report, start), nil
}

func scanResult(r application.ScanReport, start time.Time) ScanResult {
	return ScanResult{
		Folder:     r.Folder,
		Scanned:    r.Scanned,
		Added:      r.Added,
		Total:      r.Total,
		DurationMs: time.Since(start).Milliseconds(),
	}
}

// ── reads ────────────────────────────────────────────────────────────────────

func (l *Library) TrackCount() (int, error) { return l.service.Count() }

func (l *Library) Home() (Home, error) {
	home := Home{RecentTracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	data, err := l.service.Home()
	if err != nil {
		return home, err
	}
	home.RecentTracks = l.urls.tracks(data.Recent)
	home.Albums = l.urls.albums(data.Albums)
	home.Artists = l.urls.artists(data.Artists)
	return home, nil
}

func (l *Library) AllTracks() ([]Track, error) {
	tracks, err := l.service.AllTracks()
	return l.urls.tracks(tracks), err
}

func (l *Library) Albums() ([]Album, error) {
	albums, err := l.service.Albums()
	return l.urls.albums(albums), err
}

func (l *Library) Artists() ([]Artist, error) {
	artists, err := l.service.Artists()
	return l.urls.artists(artists), err
}

func (l *Library) AlbumDetail(id string) (AlbumDetail, error) {
	detail, err := l.service.AlbumDetail(domain.AlbumID(id))
	if err != nil {
		return AlbumDetail{Tracks: []Track{}}, err
	}
	return AlbumDetail{Album: l.urls.album(detail.Album), Tracks: l.urls.tracks(detail.Tracks)}, nil
}

func (l *Library) ArtistDetail(id string) (ArtistDetail, error) {
	detail, err := l.service.ArtistDetail(domain.ArtistID(id))
	if err != nil {
		return ArtistDetail{Albums: []Album{}, Tracks: []Track{}}, err
	}
	return ArtistDetail{
		Artist: l.urls.artist(detail.Artist),
		Albums: l.urls.albums(detail.Albums),
		Tracks: l.urls.tracks(detail.Tracks),
	}, nil
}

func (l *Library) Tracks(ids []string) ([]Track, error) {
	tids := make([]domain.TrackID, len(ids))
	for i, id := range ids {
		tids[i] = domain.TrackID(id)
	}
	tracks, err := l.service.Tracks(tids)
	return l.urls.tracks(tracks), err
}

func (l *Library) Search(query string) (SearchResult, error) {
	empty := SearchResult{Tracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	result, err := l.service.Search(query)
	if err != nil {
		return empty, err
	}
	return SearchResult{
		Tracks:  l.urls.tracks(result.Tracks),
		Albums:  l.urls.albums(result.Albums),
		Artists: l.urls.artists(result.Artists),
	}, nil
}

// StreamURL maps a playback URL to a loopback, CORS-clean URL: our own /media is
// returned unchanged, a remote provider URL is wrapped in the /stream byte-proxy.
// The frontend routes both audible playback and Web Audio analysis through it, so
// the main <audio> is always same-origin and can be sampled without tainting.
func (l *Library) StreamURL(raw string) string {
	return l.urls.stream(raw)
}

// Lyric returns a track's raw sidecar lyric text (LRC), "" when it has none. The
// frontend parses the LRC into timed lines, so no wire DTO is needed.
func (l *Library) Lyric(id string) (string, error) {
	return l.service.Lyric(domain.TrackID(id))
}
