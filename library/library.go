// Package library is the application layer for the on-device music source: the
// Wails-bound service that orchestrates the domain ports (Catalog + Scanner) and
// the media server, and projects domain entities to wire DTOs. It is the only
// package main binds; the frontend `LocalMusic` provider reaches it over the
// generated JS bridge.
package library

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"changeme/library/domain"
	"changeme/library/media"
	"changeme/library/scan"
	"changeme/library/sqlite"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// The SQLite catalog also satisfies the media server's Source port.
var _ media.Source = (*sqlite.Catalog)(nil)

// Library orchestrates scanning + catalog reads + media serving. It depends on
// the domain ports (interfaces) so reads can be driven off a fake in tests;
// concrete adapters are wired in New. Read methods return empty (never nil)
// slices and guard a missing catalog, so a DB-open failure degrades to an empty
// library rather than crashing the app shell.
type Library struct {
	ctx     context.Context
	catalog domain.Catalog
	scanner domain.Scanner
	media   *media.Server
	urls    mediaURLs
	mu      sync.Mutex // serializes scans (one writer at a time)
	ready   bool
}

// New opens the database + media server under the OS app-config dir. Failures
// are logged and leave the Library inert rather than aborting app startup.
func New() *Library {
	l := &Library{}
	if err := l.open(); err != nil {
		fmt.Println("[library] init failed:", err)
	}
	return l
}

func (l *Library) open() error {
	base, err := os.UserConfigDir()
	if err != nil {
		return err
	}
	dataDir := filepath.Join(base, "PLANET")
	coversDir := filepath.Join(dataDir, "covers")
	if err := os.MkdirAll(coversDir, 0o755); err != nil {
		return err
	}

	catalog, err := sqlite.Open(filepath.Join(dataDir, "library.db"))
	if err != nil {
		return err
	}
	server, err := media.Start(coversDir, catalog) // catalog satisfies media.Source
	if err != nil {
		return err
	}

	l.catalog = catalog
	l.scanner = scan.New(coversDir)
	l.media = server
	l.urls = mediaURLs{base: server.BaseURL()}
	l.ready = true
	return nil
}

// Attach captures the Wails runtime context (needed for native dialogs), called
// from the app's OnStartup. It is a package function rather than a bound method
// on purpose: a bound method taking context.Context would surface on the JS
// bridge and make Wails emit a context.Context reference the generated
// TypeScript can't resolve.
func Attach(ctx context.Context, l *Library) { l.ctx = ctx }

func (l *Library) check() error {
	if !l.ready || l.catalog == nil {
		return errors.New("local library unavailable")
	}
	return nil
}

// ── scanning ─────────────────────────────────────────────────────────────────

// PickFolder opens a native directory chooser; returns "" if the user cancels.
func (l *Library) PickFolder() (string, error) {
	if l.ctx == nil {
		return "", errors.New("runtime not ready")
	}
	return wailsruntime.OpenDirectoryDialog(l.ctx, wailsruntime.OpenDialogOptions{
		Title: "选择音乐文件夹",
	})
}

// PickAndScan chains PickFolder + ScanFolder — the one call the Settings button
// makes. A cancelled dialog returns a zero ScanResult with no error.
func (l *Library) PickAndScan() (ScanResult, error) {
	folder, err := l.PickFolder()
	if err != nil || folder == "" {
		return ScanResult{}, err
	}
	return l.ScanFolder(folder)
}

// ScanFolder indexes every audio file under folder into the library.
func (l *Library) ScanFolder(folder string) (ScanResult, error) {
	if err := l.check(); err != nil {
		return ScanResult{}, err
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	start := time.Now()
	metas, seen, err := l.scanner.Scan(folder)
	if err != nil {
		return ScanResult{}, err
	}
	at := time.Now().UnixMilli()
	added, total, err := l.catalog.Save(folder, metas, at)
	if err != nil {
		return ScanResult{}, err
	}
	return ScanResult{
		Folder:     folder,
		Scanned:    seen,
		Added:      added,
		Total:      total,
		DurationMs: time.Since(start).Milliseconds(),
	}, nil
}

// ── reads (backing the MusicProvider port) ──────────────────────────────────

func (l *Library) TrackCount() (int, error) {
	if err := l.check(); err != nil {
		return 0, err
	}
	return l.catalog.Count()
}

func (l *Library) Home() (Home, error) {
	home := Home{RecentTracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	if err := l.check(); err != nil {
		return home, err
	}
	recent, err := l.catalog.RecentTracks(24)
	if err != nil {
		return home, err
	}
	albums, err := l.catalog.Albums()
	if err != nil {
		return home, err
	}
	artists, err := l.catalog.Artists()
	if err != nil {
		return home, err
	}
	home.RecentTracks = l.urls.tracks(recent)
	home.Albums = l.urls.albums(albums)
	home.Artists = l.urls.artists(artists)
	return home, nil
}

func (l *Library) AllTracks() ([]Track, error) {
	if err := l.check(); err != nil {
		return []Track{}, err
	}
	tracks, err := l.catalog.AllTracks()
	return l.urls.tracks(tracks), err
}

func (l *Library) Albums() ([]Album, error) {
	if err := l.check(); err != nil {
		return []Album{}, err
	}
	albums, err := l.catalog.Albums()
	return l.urls.albums(albums), err
}

func (l *Library) Artists() ([]Artist, error) {
	if err := l.check(); err != nil {
		return []Artist{}, err
	}
	artists, err := l.catalog.Artists()
	return l.urls.artists(artists), err
}

func (l *Library) AlbumDetail(id string) (AlbumDetail, error) {
	detail := AlbumDetail{Tracks: []Track{}}
	if err := l.check(); err != nil {
		return detail, err
	}
	album, err := l.catalog.Album(domain.AlbumID(id))
	if err != nil || album == nil {
		return detail, err
	}
	tracks, err := l.catalog.TracksByAlbum(album.ID)
	if err != nil {
		return detail, err
	}
	detail.Album = l.urls.album(*album)
	detail.Tracks = l.urls.tracks(tracks)
	return detail, nil
}

func (l *Library) ArtistDetail(id string) (ArtistDetail, error) {
	detail := ArtistDetail{Albums: []Album{}, Tracks: []Track{}}
	if err := l.check(); err != nil {
		return detail, err
	}
	artist, err := l.catalog.Artist(domain.ArtistID(id))
	if err != nil || artist == nil {
		return detail, err
	}
	albums, err := l.catalog.AlbumsByArtist(artist.ID)
	if err != nil {
		return detail, err
	}
	tracks, err := l.catalog.TracksByArtist(artist.ID)
	if err != nil {
		return detail, err
	}
	detail.Artist = l.urls.artist(*artist)
	detail.Albums = l.urls.albums(albums)
	detail.Tracks = l.urls.tracks(tracks)
	return detail, nil
}

func (l *Library) Tracks(ids []string) ([]Track, error) {
	if len(ids) == 0 {
		return []Track{}, nil
	}
	if err := l.check(); err != nil {
		return []Track{}, err
	}
	tids := make([]domain.TrackID, len(ids))
	for i, id := range ids {
		tids[i] = domain.TrackID(id)
	}
	tracks, err := l.catalog.Tracks(tids)
	return l.urls.tracks(tracks), err
}

func (l *Library) Search(query string) (SearchResult, error) {
	empty := SearchResult{Tracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	if err := l.check(); err != nil {
		return empty, err
	}
	result, err := l.catalog.Search(query, 50)
	if err != nil {
		return empty, err
	}
	return SearchResult{
		Tracks:  l.urls.tracks(result.Tracks),
		Albums:  l.urls.albums(result.Albums),
		Artists: l.urls.artists(result.Artists),
	}, nil
}
