// Package application is the on-device library's use-case layer. It orchestrates
// the domain ports — Catalog (persistence), Scanner (folder read), FolderPicker
// (native dialog) — and returns domain entities. It has no knowledge of Wails or
// the wire format: the backend interface adapter wires concrete implementations
// in and projects results to the frontend, so these use cases run under a fake
// in tests.
package application

import (
	"context"
	"time"

	"github.com/Tangerg/planet_new/backend/domain"
)

// ScanReport summarizes a persisted scan. Complete is false when readable files
// were saved but an unobservable subtree prevented authoritative pruning;
// wall-clock timing remains a presentation concern added by the adapter.
type ScanReport struct {
	Folder   string
	Scanned  int
	Added    int
	Total    int
	Complete bool
}

// Home is the browse/personalized payload as domain entities.
type Home struct {
	Recent  []domain.Track
	Albums  []domain.Album
	Artists []domain.Artist
}

// AlbumDetail / ArtistDetail are query composites (entity + its tracks/albums).
type AlbumDetail struct {
	Album  domain.Album
	Tracks []domain.Track
}

type ArtistDetail struct {
	Artist domain.Artist
	Albums []domain.Album
	Tracks []domain.Track
}

// Clock is the application time port used for persistence ordering. The
// composition root supplies wall time; tests can supply a fixed instant.
type Clock interface {
	Now() time.Time
}

// Service is the on-device library's use cases. Depends only on ports, so it is
// framework-free and testable in isolation.
type Service struct {
	catalog  domain.Catalog
	scanner  domain.Scanner
	picker   FolderPicker
	lyrics   domain.LyricReader
	clock    Clock
	scanGate chan struct{} // serializes scans while allowing waiters to cancel
}

func NewService(catalog domain.Catalog, scanner domain.Scanner, picker FolderPicker, lyrics domain.LyricReader, clock Clock) *Service {
	return &Service{
		catalog: catalog, scanner: scanner, picker: picker, lyrics: lyrics, clock: clock,
		scanGate: make(chan struct{}, 1),
	}
}

// available guards a degraded backend (catalog + scanner are wired together, so
// a nil catalog means the whole infra failed to open).
func (s *Service) available() error {
	if s == nil || s.catalog == nil {
		return ErrUnavailable
	}
	return nil
}

func (s *Service) scanAvailable() error {
	if err := s.available(); err != nil {
		return err
	}
	if s.scanner == nil || s.clock == nil || s.scanGate == nil {
		return ErrUnavailable
	}
	return nil
}

// lyricAvailable reports the degraded backend separately from a track that
// simply has no sidecar: a missing reader is infrastructure, not a domain fact.
func (s *Service) lyricAvailable() error {
	if err := s.available(); err != nil {
		return err
	}
	if s.lyrics == nil {
		return ErrUnavailable
	}
	return nil
}

// ── scanning ─────────────────────────────────────────────────────────────────

// pickFolder opens the native chooser; "" means the user cancelled.
func (s *Service) pickFolder(ctx context.Context) (string, error) {
	if s == nil || s.picker == nil {
		return "", ErrUnavailable
	}
	return s.picker.Pick(ctx)
}

// PickAndScan is the library's only scan use case: choose a folder, then index
// it. A cancelled dialog returns a zero report (Folder == "") with no error.
// The two halves stay separate for readability, not as separately drivable
// operations — nothing outside this file has a reason to run half a scan.
func (s *Service) PickAndScan(ctx context.Context) (ScanReport, error) {
	folder, err := s.pickFolder(ctx)
	if err != nil || folder == "" {
		return ScanReport{}, err
	}
	return s.scanFolder(ctx, folder)
}

// scanFolder indexes the observable audio files under folder into the catalog.
func (s *Service) scanFolder(ctx context.Context, folder string) (ScanReport, error) {
	if err := s.scanAvailable(); err != nil {
		return ScanReport{}, err
	}
	select {
	case s.scanGate <- struct{}{}:
		defer func() { <-s.scanGate }()
	case <-ctx.Done():
		return ScanReport{}, ctx.Err()
	}

	snapshot, err := s.scanner.Scan(ctx, folder)
	if err != nil {
		return ScanReport{}, err
	}
	added, total, err := s.catalog.Save(ctx, folder, snapshot, s.clock.Now().UnixMilli())
	if err != nil {
		return ScanReport{}, err
	}
	return ScanReport{
		Folder:   folder,
		Scanned:  snapshot.FilesSeen,
		Added:    added,
		Total:    total,
		Complete: snapshot.AllowsPrune(),
	}, nil
}

// ── reads ────────────────────────────────────────────────────────────────────

func (s *Service) Home(ctx context.Context) (Home, error) {
	if err := s.available(); err != nil {
		return Home{}, err
	}
	recent, err := s.catalog.RecentTracks(ctx, 24)
	if err != nil {
		return Home{}, err
	}
	albums, err := s.catalog.Albums(ctx)
	if err != nil {
		return Home{}, err
	}
	artists, err := s.catalog.Artists(ctx)
	if err != nil {
		return Home{}, err
	}
	return Home{Recent: recent, Albums: albums, Artists: artists}, nil
}

func (s *Service) AllTracks(ctx context.Context) ([]domain.Track, error) {
	if err := s.available(); err != nil {
		return nil, err
	}
	return s.catalog.AllTracks(ctx)
}

func (s *Service) AlbumDetail(ctx context.Context, id domain.AlbumID) (*AlbumDetail, error) {
	if err := s.available(); err != nil {
		return nil, err
	}
	album, err := s.catalog.Album(ctx, id)
	if err != nil {
		return nil, err
	}
	if album == nil {
		return nil, nil
	}
	tracks, err := s.catalog.TracksByAlbum(ctx, id)
	if err != nil {
		return nil, err
	}
	return &AlbumDetail{Album: *album, Tracks: tracks}, nil
}

func (s *Service) ArtistDetail(ctx context.Context, id domain.ArtistID) (*ArtistDetail, error) {
	if err := s.available(); err != nil {
		return nil, err
	}
	artist, err := s.catalog.Artist(ctx, id)
	if err != nil {
		return nil, err
	}
	if artist == nil {
		return nil, nil
	}
	albums, err := s.catalog.AlbumsByArtist(ctx, id)
	if err != nil {
		return nil, err
	}
	tracks, err := s.catalog.TracksByArtist(ctx, id)
	if err != nil {
		return nil, err
	}
	return &ArtistDetail{Artist: *artist, Albums: albums, Tracks: tracks}, nil
}

func (s *Service) Tracks(ctx context.Context, ids []domain.TrackID) ([]domain.Track, error) {
	if err := s.available(); err != nil {
		return nil, err
	}
	return s.catalog.Tracks(ctx, ids)
}

func (s *Service) Search(ctx context.Context, query string) (domain.SearchResult, error) {
	if err := s.available(); err != nil {
		return domain.EmptySearchResult(), err
	}
	return s.catalog.Search(ctx, query, 50)
}

// Lyric returns the raw sidecar lyric text (LRC) for a track, "" when it has
// none. A missing track is represented by an empty path from the catalog;
// infrastructure failures, a degraded backend and cancellation remain errors so
// callers do not mistake a failed lookup for a valid "no lyrics" result.
func (s *Service) Lyric(ctx context.Context, id domain.TrackID) (string, error) {
	if err := s.lyricAvailable(); err != nil {
		return "", err
	}
	path, err := s.catalog.TrackPath(ctx, id)
	if err != nil {
		return "", err
	}
	if path == "" {
		return "", nil
	}
	return s.lyrics.Lyric(ctx, path)
}
