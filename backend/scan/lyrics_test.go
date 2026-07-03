package scan

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSidecarLyricsReadsSiblingLrc(t *testing.T) {
	dir := t.TempDir()
	audio := filepath.Join(dir, "song.flac")
	lrc := "[00:01.00]hello\n[00:02.00]world\n"
	if err := os.WriteFile(filepath.Join(dir, "song.lrc"), []byte(lrc), 0o644); err != nil {
		t.Fatal(err)
	}

	got, err := SidecarLyrics{}.Lyric(audio)
	if err != nil {
		t.Fatal(err)
	}
	if got != lrc {
		t.Errorf("lyric = %q, want the sibling .lrc contents %q", got, lrc)
	}
}

func TestSidecarLyricsMatchesUppercaseExtension(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "song.LRC"), []byte("[00:00.00]x"), 0o644); err != nil {
		t.Fatal(err)
	}
	got, err := SidecarLyrics{}.Lyric(filepath.Join(dir, "song.mp3"))
	if err != nil {
		t.Fatal(err)
	}
	if got != "[00:00.00]x" {
		t.Errorf("lyric = %q, want the .LRC sidecar to be found", got)
	}
}

func TestSidecarLyricsMissingIsEmptyNotError(t *testing.T) {
	dir := t.TempDir()
	got, err := SidecarLyrics{}.Lyric(filepath.Join(dir, "song.mp3"))
	if err != nil {
		t.Errorf("a missing sidecar must not error, got %v", err)
	}
	if got != "" {
		t.Errorf("lyric = %q, want empty for a track with no .lrc", got)
	}
}
