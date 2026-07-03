// Package scan is the filesystem/tag adapter implementing domain.Scanner: it
// walks a folder, reads each audio file's tags, extracts album cover art, and
// probes duration — producing domain.TrackMetadata for the repository to save.
package scan

import (
	"os"
	"path/filepath"
	"slices"
	"strings"

	"changeme/backend/domain"

	"github.com/dhowden/tag"
)

var audioExts = map[string]bool{
	".mp3": true, ".flac": true, ".m4a": true, ".aac": true,
	".ogg": true, ".opus": true, ".wav": true, ".wma": true,
}

var coverNames = []string{"cover", "folder", "front", "albumart"}

// Scanner extracts album art into coversDir (once per album) while walking.
type Scanner struct {
	coversDir string
}

var _ domain.Scanner = (*Scanner)(nil)

func New(coversDir string) *Scanner { return &Scanner{coversDir: coversDir} }

// Scan walks root and returns metadata for every audio file, plus the count of
// audio files seen. Unreadable entries are skipped, not fatal — one bad file
// must not abort a whole-library scan.
func (s *Scanner) Scan(root string) ([]domain.TrackMetadata, int, error) {
	var metas []domain.TrackMetadata
	seen := 0

	err := filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() || !audioExts[strings.ToLower(filepath.Ext(path))] {
			return nil
		}
		seen++
		metas = append(metas, s.parseFile(path))
		return nil
	})
	return metas, seen, err
}

func (s *Scanner) parseFile(path string) domain.TrackMetadata {
	meta := domain.TrackMetadata{Path: path, Duration: probeDuration(path)}

	f, err := os.Open(path)
	if err != nil {
		meta.CoverExt = s.coverFromDir(path, meta.ToAlbum().ID)
		return meta
	}
	defer f.Close()

	tags, err := tag.ReadFrom(f)
	if err != nil {
		// No readable tags: still index it, titled by filename (domain fills that).
		meta.CoverExt = s.coverFromDir(path, meta.ToAlbum().ID)
		return meta
	}

	meta.Title = tags.Title()
	meta.Album = tags.Album()
	meta.Artist = tags.Artist()
	meta.AlbumArtist = tags.AlbumArtist()
	meta.Genre = tags.Genre()
	meta.Year = tags.Year()
	meta.TrackNo, _ = tags.Track()
	meta.DiscNo, _ = tags.Disc()
	meta.CoverExt = s.extractCover(tags, path, meta.ToAlbum().ID)
	return meta
}

// extractCover writes the album's embedded picture to coversDir/<albumId>.<ext>
// once, returning the extension; falls back to a sibling cover image; "" when the
// album has no art. Idempotent — an existing cover is reused.
func (s *Scanner) extractCover(tags tag.Metadata, path string, alid domain.AlbumID) string {
	if ext := s.existingCover(alid); ext != "" {
		return ext
	}
	if pic := tags.Picture(); pic != nil && len(pic.Data) > 0 {
		if ext := normalizeImageExt(pic.Ext); ext != "" {
			if err := os.WriteFile(s.coverPath(alid, ext), pic.Data, 0o644); err == nil {
				return ext
			}
		}
	}
	return s.coverFromDir(path, alid)
}

// coverFromDir copies a sibling cover image (cover.jpg / folder.png / …) into the
// covers cache, returning its extension or "".
func (s *Scanner) coverFromDir(path string, alid domain.AlbumID) string {
	if ext := s.existingCover(alid); ext != "" {
		return ext
	}
	entries, err := os.ReadDir(filepath.Dir(path))
	if err != nil {
		return ""
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := strings.ToLower(e.Name())
		stem := strings.TrimSuffix(name, filepath.Ext(name))
		ext := normalizeImageExt(strings.TrimPrefix(filepath.Ext(name), "."))
		if ext == "" || !isCoverName(stem) {
			continue
		}
		if data, err := os.ReadFile(filepath.Join(filepath.Dir(path), e.Name())); err == nil {
			if err := os.WriteFile(s.coverPath(alid, ext), data, 0o644); err == nil {
				return ext
			}
		}
	}
	return ""
}

func (s *Scanner) coverPath(alid domain.AlbumID, ext string) string {
	return filepath.Join(s.coversDir, alid.String()+"."+ext)
}

func (s *Scanner) existingCover(alid domain.AlbumID) string {
	for _, ext := range []string{"jpg", "png", "webp", "gif"} {
		if _, err := os.Stat(s.coverPath(alid, ext)); err == nil {
			return ext
		}
	}
	return ""
}

func isCoverName(stem string) bool { return slices.Contains(coverNames, stem) }

func normalizeImageExt(ext string) string {
	switch strings.ToLower(strings.TrimPrefix(ext, ".")) {
	case "jpg", "jpeg":
		return "jpg"
	case "png":
		return "png"
	case "webp":
		return "webp"
	case "gif":
		return "gif"
	default:
		return ""
	}
}
