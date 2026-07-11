package scan

import (
	"context"
	"errors"
	"io/fs"
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

	snapshot, err := New(coversDir).Scan(context.Background(), musicDir)
	if err != nil {
		t.Fatal(err)
	}
	if !snapshot.AllowsPrune() {
		t.Fatal("fully observed directory should produce a complete snapshot")
	}
	if snapshot.FilesSeen != 1 || len(snapshot.Metadata) != 1 {
		t.Fatalf("seen=%d metas=%d, want 1/1 (only the audio file)", snapshot.FilesSeen, len(snapshot.Metadata))
	}

	m := snapshot.Metadata[0]
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

func TestScannerFailsWhenRootCannotBeRead(t *testing.T) {
	missing := filepath.Join(t.TempDir(), "missing")
	snapshot, err := New(t.TempDir()).Scan(context.Background(), missing)
	if err == nil {
		t.Fatal("missing root should fail the scan")
	}
	if len(snapshot.Metadata) != 0 || snapshot.FilesSeen != 0 || snapshot.AllowsPrune() {
		t.Fatalf("failed root snapshot = %+v, want a safe zero value", snapshot)
	}
}

func TestScannerMarksSnapshotPartialWhenSubtreeCannotBeRead(t *testing.T) {
	musicDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(musicDir, "readable.wav"), makeWav(4096), 0o644); err != nil {
		t.Fatal(err)
	}
	scanner := New(t.TempDir())
	realWalk := scanner.walkDir
	scanner.walkDir = func(root string, fn fs.WalkDirFunc) error {
		if err := realWalk(root, fn); err != nil {
			return err
		}
		// Simulate an unreadable descendant after the readable paths were walked.
		return fn(filepath.Join(root, "blocked"), nil, fs.ErrPermission)
	}

	snapshot, err := scanner.Scan(context.Background(), musicDir)
	if err != nil {
		t.Fatal(err)
	}
	if snapshot.AllowsPrune() {
		t.Fatal("a subtree error must remove prune authority")
	}
	if snapshot.FilesSeen != 1 || len(snapshot.Metadata) != 1 {
		t.Fatalf("partial snapshot should retain readable files, got %+v", snapshot)
	}
}

func TestScannerHonorsCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	snapshot, err := New(t.TempDir()).Scan(ctx, t.TempDir())
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("Scan error = %v, want context.Canceled", err)
	}
	if snapshot.AllowsPrune() || snapshot.FilesSeen != 0 || len(snapshot.Metadata) != 0 {
		t.Fatalf("cancelled snapshot = %+v, want safe zero value", snapshot)
	}
}
