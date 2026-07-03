// Package application is the on-device library's use-case layer. It orchestrates
// the domain ports — Catalog (persistence), Scanner (folder read), FolderPicker
// (native dialog) — and returns domain entities. It has no knowledge of Wails or
// the wire format: the backend interface adapter wires concrete implementations
// in and projects results to the frontend, so these use cases run under a fake
// in tests.
package application

import (
	"errors"
	"sync"
	"time"

	"changeme/backend/domain"
)

// ErrUnavailable is returned by every use case when the catalog failed to open
// (a degraded shell), so the adapter can surface empty results instead of
// crashing.
var ErrUnavailable = errors.New("local library unavailable")

// ScanReport summarizes a completed scan (counts only — wall-clock timing is a
// presentation concern the adapter adds).
type ScanReport struct {
	Folder  string
	Scanned int
	Added   int
	Total   int
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

// Service is the on-device library's use cases. Depends only on ports, so it is
// framework-free and testable in isolation.
type Service struct {
	catalog domain.Catalog
	scanner domain.Scanner
	picker  FolderPicker
	mu      sync.Mutex // serializes scans (one writer at a time)
}

func NewService(catalog domain.Catalog, scanner domain.Scanner, picker FolderPicker) *Service {
	return &Service{catalog: catalog, scanner: scanner, picker: picker}
}

// available guards a degraded backend (catalog + scanner are wired together, so
// a nil catalog means the whole infra failed to open).
func (s *Service) available() error {
	if s.catalog == nil {
		return ErrUnavailable
	}
	return nil
}

// ── scanning ─────────────────────────────────────────────────────────────────

// PickFolder opens the native chooser; "" means the user cancelled.
func (s *Service) PickFolder() (string, error) {
	if s.picker == nil {
		return "", errors.New("no folder picker")
	}
	return s.picker.Pick()
}

// PickAndScan chains a folder choice + scan. A cancelled dialog returns a zero
// report (Folder == "") with no error.
func (s *Service) PickAndScan() (ScanReport, error) {
	folder, err := s.PickFolder()
	if err != nil || folder == "" {
		return ScanReport{}, err
	}
	return s.ScanFolder(folder)
}

// ScanFolder indexes every audio file under folder into the catalog.
func (s *Service) ScanFolder(folder string) (ScanReport, error) {
	if err := s.available(); err != nil {
		return ScanReport{}, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	metas, seen, err := s.scanner.Scan(folder)
	if err != nil {
		return ScanReport{}, err
	}
	added, total, err := s.catalog.Save(folder, metas, time.Now().UnixMilli())
	if err != nil {
		return ScanReport{}, err
	}
	return ScanReport{Folder: folder, Scanned: seen, Added: added, Total: total}, nil
}

// ── reads ────────────────────────────────────────────────────────────────────

func (s *Service) Count() (int, error) {
	if err := s.available(); err != nil {
		return 0, err
	}
	return s.catalog.Count()
}

func (s *Service) Home() (Home, error) {
	if err := s.available(); err != nil {
		return Home{}, err
	}
	recent, err := s.catalog.RecentTracks(24)
	if err != nil {
		return Home{}, err
	}
	albums, err := s.catalog.Albums()
	if err != nil {
		return Home{}, err
	}
	artists, err := s.catalog.Artists()
	if err != nil {
		return Home{}, err
	}
	return Home{Recent: recent, Albums: albums, Artists: artists}, nil
}

func (s *Service) AllTracks() ([]domain.Track, error) {
	if err := s.available(); err != nil {
		return nil, err
	}
	return s.catalog.AllTracks()
}

func (s *Service) Albums() ([]domain.Album, error) {
	if err := s.available(); err != nil {
		return nil, err
	}
	return s.catalog.Albums()
}

func (s *Service) Artists() ([]domain.Artist, error) {
	if err := s.available(); err != nil {
		return nil, err
	}
	return s.catalog.Artists()
}

func (s *Service) AlbumDetail(id domain.AlbumID) (AlbumDetail, error) {
	if err := s.available(); err != nil {
		return AlbumDetail{}, err
	}
	album, err := s.catalog.Album(id)
	if err != nil || album == nil {
		return AlbumDetail{}, err
	}
	tracks, err := s.catalog.TracksByAlbum(id)
	if err != nil {
		return AlbumDetail{}, err
	}
	return AlbumDetail{Album: *album, Tracks: tracks}, nil
}

func (s *Service) ArtistDetail(id domain.ArtistID) (ArtistDetail, error) {
	if err := s.available(); err != nil {
		return ArtistDetail{}, err
	}
	artist, err := s.catalog.Artist(id)
	if err != nil || artist == nil {
		return ArtistDetail{}, err
	}
	albums, err := s.catalog.AlbumsByArtist(id)
	if err != nil {
		return ArtistDetail{}, err
	}
	tracks, err := s.catalog.TracksByArtist(id)
	if err != nil {
		return ArtistDetail{}, err
	}
	return ArtistDetail{Artist: *artist, Albums: albums, Tracks: tracks}, nil
}

func (s *Service) Tracks(ids []domain.TrackID) ([]domain.Track, error) {
	if err := s.available(); err != nil {
		return nil, err
	}
	return s.catalog.Tracks(ids)
}

func (s *Service) Search(query string) (domain.SearchResult, error) {
	if err := s.available(); err != nil {
		return domain.EmptySearchResult(), err
	}
	return s.catalog.Search(query, 50)
}
