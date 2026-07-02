package library

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/dhowden/tag"
)

// audioExts is the set of file extensions treated as playable audio.
var audioExts = map[string]bool{
	".mp3": true, ".flac": true, ".m4a": true, ".aac": true,
	".ogg": true, ".opus": true, ".wav": true, ".wma": true,
}

// coverNames are directory-level cover images used when a file embeds none.
var coverNames = []string{"cover", "folder", "front", "albumart"}

// scanFolder walks `root`, parses every audio file's tags, extracts album cover
// art into coversDir (once per album), and returns the parsed rows. Unreadable
// files are skipped, not fatal — one bad file must not abort a library scan.
func scanFolder(root, coversDir string) ([]parsedTrack, int, error) {
	var parsed []parsedTrack
	scanned := 0

	err := filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil // unreadable dir entry: skip, keep walking
		}
		if d.IsDir() || !audioExts[strings.ToLower(filepath.Ext(path))] {
			return nil
		}
		scanned++
		pt := parseFile(path, coversDir)
		if pt != nil {
			parsed = append(parsed, *pt)
		}
		return nil
	})
	return parsed, scanned, err
}

func parseFile(path, coversDir string) *parsedTrack {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()

	pt := parsedTrack{Path: path, DurationMs: probeDurationMs(path)}

	meta, err := tag.ReadFrom(f)
	if err != nil {
		// No readable tags: still index the file, titled by its name.
		pt.Title = baseName(path)
		pt.CoverExt = ensureDirCover(path, coversDir, albumID("Unknown Artist", "Unknown Album"))
		return &pt
	}

	pt.Title = meta.Title()
	pt.Album = meta.Album()
	pt.Artist = meta.Artist()
	pt.AlbumArtist = meta.AlbumArtist()
	pt.Genre = meta.Genre()
	pt.Year = meta.Year()
	pt.TrackNo, _ = meta.Track()
	pt.DiscNo, _ = meta.Disc()

	artistName := firstNonEmpty(pt.AlbumArtist, pt.Artist, "Unknown Artist")
	albumName := firstNonEmpty(pt.Album, "Unknown Album")
	alid := albumID(artistName, albumName)

	pt.CoverExt = extractCover(meta, path, coversDir, alid)
	return &pt
}

// extractCover writes the album's embedded picture to coversDir/<albumId>.<ext>
// once, and returns the extension. Falls back to a directory cover image. Returns
// "" when the album has no art. Idempotent: an existing cover is reused.
func extractCover(meta tag.Metadata, path, coversDir, alid string) string {
	if ext := existingCover(coversDir, alid); ext != "" {
		return ext
	}
	if pic := meta.Picture(); pic != nil && len(pic.Data) > 0 {
		ext := normalizeImageExt(pic.Ext)
		if err := os.WriteFile(filepath.Join(coversDir, alid+"."+ext), pic.Data, 0o644); err == nil {
			return ext
		}
	}
	return ensureDirCover(path, coversDir, alid)
}

// ensureDirCover copies a sibling cover image (cover.jpg / folder.png / …) into
// the covers cache for this album, returning its extension or "".
func ensureDirCover(path, coversDir, alid string) string {
	if ext := existingCover(coversDir, alid); ext != "" {
		return ext
	}
	dir := filepath.Dir(path)
	entries, err := os.ReadDir(dir)
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
		if ext == "" {
			continue
		}
		for _, cn := range coverNames {
			if stem == cn {
				if data, err := os.ReadFile(filepath.Join(dir, e.Name())); err == nil {
					if err := os.WriteFile(filepath.Join(coversDir, alid+"."+ext), data, 0o644); err == nil {
						return ext
					}
				}
			}
		}
	}
	return ""
}

func existingCover(coversDir, alid string) string {
	for _, ext := range []string{"jpg", "png", "webp", "gif"} {
		if _, err := os.Stat(filepath.Join(coversDir, alid+"."+ext)); err == nil {
			return ext
		}
	}
	return ""
}

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
