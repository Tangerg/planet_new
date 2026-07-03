package scan

import (
	"os"
	"path/filepath"
	"testing"
)

func TestScannerReadsFilesAndExtractsDirCover(t *testing.T) {
	musicDir := t.TempDir()
	coversDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(musicDir, "song.wav"), makeWav(4096), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(musicDir, "cover.jpg"), []byte("\xff\xd8\xff\xe0art"), 0o644); err != nil {
		t.Fatal(err)
	}
	// A non-audio file must be ignored.
	if err := os.WriteFile(filepath.Join(musicDir, "notes.txt"), []byte("hi"), 0o644); err != nil {
		t.Fatal(err)
	}

	metas, seen, err := New(coversDir).Scan(musicDir)
	if err != nil {
		t.Fatal(err)
	}
	if seen != 1 || len(metas) != 1 {
		t.Fatalf("seen=%d metas=%d, want 1/1 (only the audio file)", seen, len(metas))
	}

	m := metas[0]
	if m.Duration.Millis() <= 0 {
		t.Error("scanner did not probe a duration for the WAV")
	}
	if m.CoverExt != "jpg" {
		t.Errorf("CoverExt = %q, want jpg from the sibling cover.jpg", m.CoverExt)
	}
	// The sibling cover was cached under the derived album id.
	alid := m.ToAlbum().ID
	if _, err := os.Stat(filepath.Join(coversDir, alid.String()+".jpg")); err != nil {
		t.Errorf("cover not cached at <albumId>.jpg: %v", err)
	}
	// No tags → title falls back to the file name.
	if got := m.ToTrack().Title; got != "song" {
		t.Errorf("title = %q, want filename fallback 'song'", got)
	}
}
