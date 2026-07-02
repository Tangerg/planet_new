package library

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// Library is the Wails-bound on-device music service. It is constructed once at
// startup (opening the DB + media server), bound into the runtime, and reached
// from the frontend `LocalMusic` provider over the generated JS bridge.
//
// Read methods return empty slices (never nil) so the TypeScript side gets `[]`,
// and guard a missing store so a DB-open failure degrades to an empty library
// rather than crashing the app shell.
type Library struct {
	ctx       context.Context
	store     *store
	media     *mediaServer
	coversDir string
	mu        sync.Mutex // serializes scans (one writer at a time)
	ready     bool
}

// New opens the database + media server under the OS app-config dir. Failures are
// logged and leave the Library inert (methods return errors / empty results)
// instead of aborting app startup.
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
	l.coversDir = filepath.Join(dataDir, "covers")
	if err := os.MkdirAll(l.coversDir, 0o755); err != nil {
		return err
	}

	l.media, err = startMediaServer(l.coversDir)
	if err != nil {
		return err
	}
	l.store, err = openStore(filepath.Join(dataDir, "library.db"), l.media.baseURL)
	if err != nil {
		return err
	}
	l.media.store = l.store
	l.ready = true
	return nil
}

// Attach captures the Wails runtime context (needed for native dialogs), called
// from the app's OnStartup. It is a package function rather than a method on the
// bound struct on purpose: a bound method taking context.Context would surface on
// the JS bridge and make Wails emit a `context.Context` reference the generated
// TypeScript can't resolve. Keeping it off the struct keeps the bindings clean.
func Attach(ctx context.Context, l *Library) {
	l.ctx = ctx
}

func (l *Library) check() error {
	if !l.ready || l.store == nil {
		return errors.New("local library unavailable")
	}
	return nil
}

// ── scanning ─────────────────────────────────────────────────────────────────

// PickFolder opens a native directory chooser and returns the chosen path, or ""
// if the user cancels.
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

// ScanFolder indexes every audio file under `folder` into the library.
func (l *Library) ScanFolder(folder string) (ScanResult, error) {
	if err := l.check(); err != nil {
		return ScanResult{}, err
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	start := time.Now()
	files, scanned, err := scanFolder(folder, l.coversDir)
	if err != nil {
		return ScanResult{}, err
	}
	epoch := time.Now().UnixMilli()
	added, total, err := l.store.scanUpsert(folder, files, epoch)
	if err != nil {
		return ScanResult{}, err
	}
	return ScanResult{
		Folder:     folder,
		Scanned:    scanned,
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
	return l.store.countTracks()
}

func (l *Library) Home() (Home, error) {
	home := Home{RecentTracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	if err := l.check(); err != nil {
		return home, err
	}
	var err error
	if home.RecentTracks, err = l.store.recentTracks(24); err != nil {
		return home, err
	}
	if home.Albums, err = l.store.listAlbums(); err != nil {
		return home, err
	}
	if home.Artists, err = l.store.listArtists(); err != nil {
		return home, err
	}
	return home, nil
}

func (l *Library) AllTracks() ([]Track, error) {
	if err := l.check(); err != nil {
		return []Track{}, err
	}
	return l.store.allTracks()
}

func (l *Library) Albums() ([]Album, error) {
	if err := l.check(); err != nil {
		return []Album{}, err
	}
	return l.store.listAlbums()
}

func (l *Library) Artists() ([]Artist, error) {
	if err := l.check(); err != nil {
		return []Artist{}, err
	}
	return l.store.listArtists()
}

func (l *Library) AlbumDetail(id string) (AlbumDetail, error) {
	detail := AlbumDetail{Tracks: []Track{}}
	if err := l.check(); err != nil {
		return detail, err
	}
	album, err := l.store.albumByID(id)
	if err != nil {
		return detail, err
	}
	if album == nil {
		return detail, nil
	}
	detail.Album = *album
	if detail.Tracks, err = l.store.tracksByAlbum(id); err != nil {
		return detail, err
	}
	return detail, nil
}

func (l *Library) ArtistDetail(id string) (ArtistDetail, error) {
	detail := ArtistDetail{Albums: []Album{}, Tracks: []Track{}}
	if err := l.check(); err != nil {
		return detail, err
	}
	artist, err := l.store.artistByID(id)
	if err != nil {
		return detail, err
	}
	if artist == nil {
		return detail, nil
	}
	detail.Artist = *artist
	if detail.Albums, err = l.store.albumsByArtist(id); err != nil {
		return detail, err
	}
	if detail.Tracks, err = l.store.tracksByArtist(id); err != nil {
		return detail, err
	}
	return detail, nil
}

func (l *Library) Tracks(ids []string) ([]Track, error) {
	if err := l.check(); err != nil {
		return []Track{}, err
	}
	return l.store.tracksByIDs(ids)
}

func (l *Library) Search(query string) (SearchResult, error) {
	empty := SearchResult{Tracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	if err := l.check(); err != nil {
		return empty, err
	}
	return l.store.search(query, 50)
}
