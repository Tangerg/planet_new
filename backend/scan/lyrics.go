package scan

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"changeme/backend/domain"
)

// SidecarLyrics reads a track's sibling lyric file — "<name>.lrc" next to the
// audio file (e.g. "song.flac" → "song.lrc"). Implements domain.LyricReader.
// A missing sidecar is not an error: it returns "" so the caller treats it as
// "no lyrics". Read on demand rather than cached at scan time, so editing a
// .lrc is reflected without a re-scan.
type SidecarLyrics struct{}

var _ domain.LyricReader = SidecarLyrics{}

// Lyric returns the raw LRC text of the sidecar next to audioPath. The audio
// file's extension is swapped for .lrc; both lower- and upper-case extensions
// are tried so a "song.LRC" is found on case-sensitive filesystems too.
func (SidecarLyrics) Lyric(audioPath string) (string, error) {
	dir := filepath.Dir(audioPath)
	stem := strings.TrimSuffix(filepath.Base(audioPath), filepath.Ext(audioPath))
	for _, name := range []string{stem + ".lrc", stem + ".LRC"} {
		data, err := os.ReadFile(filepath.Join(dir, name))
		if err == nil {
			return string(data), nil
		}
		if !errors.Is(err, os.ErrNotExist) {
			return "", err
		}
	}
	return "", nil
}
