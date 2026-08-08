package backend

import (
	"context"
	"time"

	"github.com/Tangerg/planet_new/backend/application"
	"github.com/Tangerg/planet_new/backend/domain"
)

// Library is the Wails-bound adapter over the application service: it converts
// string ids at the JS boundary, delegates each use case to the service, and
// projects domain entities to wire DTOs (adding loopback URLs). The bound method
// signatures + DTO shapes are the frontend contract, so they stay stable.
//
// Every bound method that reaches a use case takes a context as its first
// parameter (StreamURL does not: it only rewrites a URL). Wails recognises that
// shape, so it stays out of the generated TypeScript and the frontend never
// passes one: what arrives is a context scoped to that single call, which Wails
// cancels when the caller abandons its promise.
type Library struct {
	service *application.Service
	urls    mediaURLs
	// lifetime ends when the composition root starts tearing infrastructure
	// down; see callScope for why a per-call context alone is not enough.
	lifetime context.Context
}

func newLibrary(lifetime context.Context, service *application.Service, urls mediaURLs) *Library {
	return &Library{service: service, urls: urls, lifetime: lifetime}
}

// callScope binds one bound-method call to both cancellations that can end it:
// the frontend abandoning the call, and the application shutting down.
//
// The link to lifetime is not redundant. Wails deliberately roots each call's
// context away from the application's, and it only cancels a window's in-flight
// calls after the shutdown hooks have run — by which point the catalog is
// already closing. Without this, a scan caught by a quit would be abandoned
// mid-transaction instead of rolling back.
func (l *Library) callScope(ctx context.Context) (context.Context, context.CancelFunc) {
	ctx, cancel := context.WithCancel(ctx)
	stop := context.AfterFunc(l.lifetime, cancel)
	return ctx, func() {
		stop()
		cancel()
	}
}

// ── scanning ─────────────────────────────────────────────────────────────────

func (l *Library) PickAndScan(ctx context.Context) (ScanResult, error) {
	ctx, done := l.callScope(ctx)
	defer done()

	start := time.Now()
	report, err := l.service.PickAndScan(ctx)
	if err != nil {
		if application.Classify("", err).Code == application.ErrorCancelled {
			return ScanResult{Status: ScanCancelled}, nil
		}
		return ScanResult{}, projectError("localLibrary.pickAndScan", err)
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

func (l *Library) Home(ctx context.Context) (Home, error) {
	ctx, done := l.callScope(ctx)
	defer done()

	home := Home{RecentTracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	data, err := l.service.Home(ctx)
	if err != nil {
		return home, projectError("localLibrary.home", err)
	}
	home.RecentTracks = l.urls.tracks(data.Recent)
	home.Albums = l.urls.albums(data.Albums)
	home.Artists = l.urls.artists(data.Artists)
	return home, nil
}

func (l *Library) AllTracks(ctx context.Context) ([]Track, error) {
	ctx, done := l.callScope(ctx)
	defer done()

	tracks, err := l.service.AllTracks(ctx)
	return l.urls.tracks(tracks), projectError("localLibrary.allTracks", err)
}

func (l *Library) AlbumDetail(ctx context.Context, id string) (AlbumDetailResult, error) {
	ctx, done := l.callScope(ctx)
	defer done()

	albumID, err := domain.ParseAlbumID(id)
	if err != nil {
		return AlbumDetailResult{}, projectError("localLibrary.albumDetail", err)
	}
	detail, err := l.service.AlbumDetail(ctx, albumID)
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

func (l *Library) ArtistDetail(ctx context.Context, id string) (ArtistDetailResult, error) {
	ctx, done := l.callScope(ctx)
	defer done()

	artistID, err := domain.ParseArtistID(id)
	if err != nil {
		return ArtistDetailResult{}, projectError("localLibrary.artistDetail", err)
	}
	detail, err := l.service.ArtistDetail(ctx, artistID)
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

func (l *Library) Tracks(ctx context.Context, ids []string) ([]Track, error) {
	ctx, done := l.callScope(ctx)
	defer done()

	tids := make([]domain.TrackID, len(ids))
	for i, id := range ids {
		parsed, err := domain.ParseTrackID(id)
		if err != nil {
			return []Track{}, projectError("localLibrary.tracks", err)
		}
		tids[i] = parsed
	}
	tracks, err := l.service.Tracks(ctx, tids)
	return l.urls.tracks(tracks), projectError("localLibrary.tracks", err)
}

func (l *Library) Search(ctx context.Context, query string) (SearchResult, error) {
	ctx, done := l.callScope(ctx)
	defer done()

	empty := SearchResult{Tracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	result, err := l.service.Search(ctx, query)
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
func (l *Library) Lyric(ctx context.Context, id string) (string, error) {
	ctx, done := l.callScope(ctx)
	defer done()

	trackID, err := domain.ParseTrackID(id)
	if err != nil {
		return "", projectError("localLibrary.lyric", err)
	}
	lyric, err := l.service.Lyric(ctx, trackID)
	return lyric, projectError("localLibrary.lyric", err)
}
