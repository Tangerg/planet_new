package backend

import (
	"bytes"
	"context"
	"encoding/binary"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/Tangerg/planet_new/backend/application"
	"github.com/Tangerg/planet_new/backend/scan"
	"github.com/Tangerg/planet_new/backend/sqlite"
)

type e2eClock struct{}

func (e2eClock) Now() time.Time { return time.UnixMilli(1_700_000_000_000) }

func e2eWAV(dataBytes int) []byte {
	const byteRate = 176400
	var data bytes.Buffer
	data.WriteString("RIFF")
	mustWriteE2EBinary(&data, binary.LittleEndian, uint32(36+dataBytes))
	data.WriteString("WAVEfmt ")
	mustWriteE2EBinary(&data, binary.LittleEndian, uint32(16))
	mustWriteE2EBinary(&data, binary.LittleEndian, uint16(1))
	mustWriteE2EBinary(&data, binary.LittleEndian, uint16(2))
	mustWriteE2EBinary(&data, binary.LittleEndian, uint32(44100))
	mustWriteE2EBinary(&data, binary.LittleEndian, uint32(byteRate))
	mustWriteE2EBinary(&data, binary.LittleEndian, uint16(4))
	mustWriteE2EBinary(&data, binary.LittleEndian, uint16(16))
	data.WriteString("data")
	mustWriteE2EBinary(&data, binary.LittleEndian, uint32(dataBytes))
	data.Write(make([]byte, dataBytes))
	return data.Bytes()
}

func mustWriteE2EBinary(buffer *bytes.Buffer, order binary.ByteOrder, value any) {
	if err := binary.Write(buffer, order, value); err != nil {
		panic(err)
	}
}

func TestLocalLibraryScanToWailsReadAndShutdown(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	musicDir := filepath.Join(root, "music")
	coversDir := filepath.Join(root, "covers")
	if err := os.MkdirAll(musicDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(coversDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(musicDir, "journey.wav"), e2eWAV(176400), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(musicDir, "journey.lrc"), []byte("[00:00.00]hello"), 0o644); err != nil {
		t.Fatal(err)
	}

	catalog, err := sqlite.Open(ctx, filepath.Join(root, "library.db"))
	if err != nil {
		t.Fatal(err)
	}
	service := application.NewService(catalog, scan.New(coversDir), nil, scan.SidecarLyrics{}, e2eClock{})
	library := newLibrary(service, mediaURLs{base: "http://127.0.0.1:9999"})
	library.attach(ctx)

	result, err := library.ScanFolder(musicDir)
	if err != nil {
		t.Fatal(err)
	}
	if result.Status != ScanComplete || result.Scanned != 1 || result.Added != 1 || result.Total != 1 {
		t.Fatalf("scan result = %+v, want complete 1/1/1", result)
	}
	home, err := library.Home()
	if err != nil {
		t.Fatal(err)
	}
	if len(home.RecentTracks) != 1 || len(home.Albums) != 1 || len(home.Artists) != 1 {
		t.Fatalf("home after scan = %+v, want one track/album/artist", home)
	}
	track := home.RecentTracks[0]
	if track.Title != "journey" || track.DurationMs != 1000 || track.PlayURL == "" {
		t.Fatalf("projected track = %+v", track)
	}
	lyric, err := library.Lyric(track.ID)
	if err != nil || lyric != "[00:00.00]hello" {
		t.Fatalf("lyric = %q, %v", lyric, err)
	}

	if err := catalog.Close(); err != nil {
		t.Fatal(err)
	}
	if _, err := library.Home(); err == nil {
		t.Fatal("library remained readable after its catalog owner closed")
	}
}
