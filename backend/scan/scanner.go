// Package scan is the filesystem/tag adapter implementing domain.Scanner: it
// walks a folder, reads each audio file's tags, extracts album cover art, and
// probes duration — producing domain.TrackMetadata for the repository to save.
package scan

import (
	"context"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/Tangerg/planet_new/backend/domain"

	"github.com/dhowden/tag"
)

var audioExts = map[string]bool{
	".mp3": true, ".flac": true, ".m4a": true, ".aac": true,
	".ogg": true, ".opus": true, ".wav": true, ".wma": true,
}

var coverNames = []string{"cover", "folder", "front", "albumart"}

// The extensions a cached cover can have. normalizeImageExt maps every accepted
// input onto one of these and existingCover probes exactly these — one list, so
// adding a format cannot leave the "already extracted" check blind to it and
// re-copy that album's art on every scan.
var coverExts = []string{"jpg", "png", "webp", "gif"}

// Scanner extracts album art into coversDir (once per album) while walking.
type Scanner struct {
	coversDir string
	walkDir   func(string, fs.WalkDirFunc) error
}

var _ domain.Scanner = (*Scanner)(nil)

func New(coversDir string) *Scanner {
	return &Scanner{coversDir: coversDir, walkDir: filepath.WalkDir}
}

// Scan walks root and returns an authoritative complete snapshot only when the
// entire tree was observable. A recoverable subtree error marks the snapshot
// partial: readable files are still indexed, but the repository must not prune
// paths absent from that observation. Root failure and cancellation abort the
// use case because no meaningful folder scan occurred.
func (s *Scanner) Scan(ctx context.Context, root string) (domain.ScanSnapshot, error) {
	var metas []domain.TrackMetadata
	seen := 0
	complete := true

	err := s.walkDir(root, func(path string, d os.DirEntry, walkErr error) error {
		if err := ctx.Err(); err != nil {
			return err
		}
		if walkErr != nil {
			if path == root {
				return walkErr
			}
			complete = false
			return nil
		}
		if d.IsDir() || !audioExts[strings.ToLower(filepath.Ext(path))] {
			return nil
		}
		seen++
		meta := s.parseFile(path)
		if err := ctx.Err(); err != nil {
			return err
		}
		metas = append(metas, meta)
		return nil
	})
	if err != nil {
		return domain.ScanSnapshot{}, err
	}
	completeness := domain.ScanPartial
	if complete {
		completeness = domain.ScanComplete
	}
	return domain.ScanSnapshot{
		Metadata:     metas,
		FilesSeen:    seen,
		Completeness: completeness,
	}, nil
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
	for _, ext := range coverExts {
		if _, err := os.Stat(s.coverPath(alid, ext)); err == nil {
			return ext
		}
	}
	return ""
}

func isCoverName(stem string) bool { return slices.Contains(coverNames, stem) }

func normalizeImageExt(ext string) string {
	normalized := strings.ToLower(strings.TrimPrefix(ext, "."))
	if normalized == "jpeg" {
		normalized = "jpg"
	}
	if !slices.Contains(coverExts, normalized) {
		return ""
	}
	return normalized
}
