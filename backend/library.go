package backend

import (
	"context"
	"sync"
	"time"

	"github.com/Tangerg/planet_new/backend/application"
	"github.com/Tangerg/planet_new/backend/domain"
)

// Library is the Wails-bound adapter over the application service: it converts
// string ids at the JS boundary, delegates each use case to the service, and
// projects domain entities to wire DTOs (adding loopback URLs). The bound method
// signatures + DTO shapes are the frontend contract, so they stay stable.
type Library struct {
	service *application.Service
	urls    mediaURLs
	ctxMu   sync.RWMutex
	ctx     context.Context
}

func (l *Library) attach(ctx context.Context) {
	l.ctxMu.Lock()
	defer l.ctxMu.Unlock()
	l.ctx = ctx
}

func (l *Library) requestContext() context.Context {
	l.ctxMu.RLock()
	defer l.ctxMu.RUnlock()
	if l.ctx == nil {
		return context.Background()
	}
	return l.ctx
}

func newLibrary(service *application.Service, urls mediaURLs) *Library {
	return &Library{service: service, urls: urls}
}

// ── scanning ─────────────────────────────────────────────────────────────────

func (l *Library) PickFolder() (string, error) {
	folder, err := l.service.PickFolder(l.requestContext())
	return folder, projectError("localLibrary.pickFolder", err)
}

func (l *Library) PickAndScan() (ScanResult, error) {
	start := time.Now()
	report, err := l.service.PickAndScan(l.requestContext())
	if err != nil {
		if application.Classify("", err).Code == application.ErrorCancelled {
			return ScanResult{Status: ScanCancelled}, nil
		}
		return ScanResult{}, projectError("localLibrary.pickAndScan", err)
	}
	return scanResult(report, start), nil
}

func (l *Library) ScanFolder(folder string) (ScanResult, error) {
	start := time.Now()
	report, err := l.service.ScanFolder(l.requestContext(), folder)
	if err != nil {
		if application.Classify("", err).Code == application.ErrorCancelled {
			return ScanResult{Status: ScanCancelled}, nil
		}
		return ScanResult{}, projectError("localLibrary.scanFolder", err)
	}
	return scanResult(report, start), nil
}

func scanResult(r application.ScanReport, start time.Time) ScanResult {
	status := ScanPartial
	if r.Folder == "" {
		status = ScanCancelled
	} else if r.Complete {
		status = ScanComplete
	}
	return ScanResult{
		Folder:     r.Folder,
		Scanned:    r.Scanned,
		Added:      r.Added,
		Total:      r.Total,
		Status:     status,
		DurationMs: time.Since(start).Milliseconds(),
	}
}

// ── reads ────────────────────────────────────────────────────────────────────

func (l *Library) TrackCount() (int, error) {
	count, err := l.service.Count(l.requestContext())
	return count, projectError("localLibrary.trackCount", err)
}

func (l *Library) Home() (Home, error) {
	home := Home{RecentTracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	data, err := l.service.Home(l.requestContext())
	if err != nil {
		return home, projectError("localLibrary.home", err)
	}
	home.RecentTracks = l.urls.tracks(data.Recent)
	home.Albums = l.urls.albums(data.Albums)
	home.Artists = l.urls.artists(data.Artists)
	return home, nil
}

func (l *Library) AllTracks() ([]Track, error) {
	tracks, err := l.service.AllTracks(l.requestContext())
	return l.urls.tracks(tracks), projectError("localLibrary.allTracks", err)
}

func (l *Library) Albums() ([]Album, error) {
	albums, err := l.service.Albums(l.requestContext())
	return l.urls.albums(albums), projectError("localLibrary.albums", err)
}

func (l *Library) Artists() ([]Artist, error) {
	artists, err := l.service.Artists(l.requestContext())
	return l.urls.artists(artists), projectError("localLibrary.artists", err)
}

func (l *Library) AlbumDetail(id string) (AlbumDetailResult, error) {
	detail, err := l.service.AlbumDetail(l.requestContext(), domain.AlbumID(id))
	if err != nil {
		return AlbumDetailResult{}, projectError("localLibrary.albumDetail", err)
	}
	return albumDetailResult(detail, l.urls), nil
}

func albumDetailResult(detail *application.AlbumDetail, urls mediaURLs) AlbumDetailResult {
	if detail == nil {
		return AlbumDetailResult{Status: LookupNotFound, Detail: AlbumDetail{Tracks: []Track{}}}
	}
	return AlbumDetailResult{
		Status: LookupFound,
		Detail: AlbumDetail{
			Album:  urls.album(detail.Album),
			Tracks: urls.tracks(detail.Tracks),
		},
	}
}

func (l *Library) ArtistDetail(id string) (ArtistDetailResult, error) {
	detail, err := l.service.ArtistDetail(l.requestContext(), domain.ArtistID(id))
	if err != nil {
		return ArtistDetailResult{}, projectError("localLibrary.artistDetail", err)
	}
	return artistDetailResult(detail, l.urls), nil
}

func artistDetailResult(detail *application.ArtistDetail, urls mediaURLs) ArtistDetailResult {
	if detail == nil {
		return ArtistDetailResult{
			Status: LookupNotFound,
			Detail: ArtistDetail{Albums: []Album{}, Tracks: []Track{}},
		}
	}
	return ArtistDetailResult{
		Status: LookupFound,
		Detail: ArtistDetail{
			Artist: urls.artist(detail.Artist),
			Albums: urls.albums(detail.Albums),
			Tracks: urls.tracks(detail.Tracks),
		},
	}
}

func (l *Library) Tracks(ids []string) ([]Track, error) {
	tids := make([]domain.TrackID, len(ids))
	for i, id := range ids {
		tids[i] = domain.TrackID(id)
	}
	tracks, err := l.service.Tracks(l.requestContext(), tids)
	return l.urls.tracks(tracks), projectError("localLibrary.tracks", err)
}

func (l *Library) Search(query string) (SearchResult, error) {
	empty := SearchResult{Tracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	result, err := l.service.Search(l.requestContext(), query)
	if err != nil {
		return empty, projectError("localLibrary.search", err)
	}
	return SearchResult{
		Tracks:  l.urls.tracks(result.Tracks),
		Albums:  l.urls.albums(result.Albums),
		Artists: l.urls.artists(result.Artists),
	}, nil
}

// StreamURL maps a playback URL to a loopback, CORS-clean URL: our own /media is
// returned unchanged, while a valid public remote URL is wrapped in the
// authenticated /stream byte-proxy. Invalid/private targets fail closed to "".
// The frontend uses it only for Web Audio analysis probes; audible playback
// remains on the provider/native URL.
func (l *Library) StreamURL(raw string) string {
	return l.urls.stream(raw)
}

// Lyric returns a track's raw sidecar lyric text (LRC), "" when it has none. The
// frontend parses the LRC into timed lines, so no wire DTO is needed.
func (l *Library) Lyric(id string) (string, error) {
	lyric, err := l.service.Lyric(l.requestContext(), domain.TrackID(id))
	return lyric, projectError("localLibrary.lyric", err)
}
