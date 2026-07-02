package library

import (
	"bytes"
	"encoding/binary"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"testing"
)

// makeWav builds a valid PCM WAV with `dataBytes` of audio payload.
func makeWav(dataBytes int) []byte {
	const byteRate = 176400
	var b bytes.Buffer
	b.WriteString("RIFF")
	binary.Write(&b, binary.LittleEndian, uint32(36+dataBytes))
	b.WriteString("WAVE")
	b.WriteString("fmt ")
	binary.Write(&b, binary.LittleEndian, uint32(16))
	binary.Write(&b, binary.LittleEndian, uint16(1))
	binary.Write(&b, binary.LittleEndian, uint16(2))
	binary.Write(&b, binary.LittleEndian, uint32(44100))
	binary.Write(&b, binary.LittleEndian, uint32(byteRate))
	binary.Write(&b, binary.LittleEndian, uint16(4))
	binary.Write(&b, binary.LittleEndian, uint16(16))
	b.WriteString("data")
	binary.Write(&b, binary.LittleEndian, uint32(dataBytes))
	b.Write(make([]byte, dataBytes))
	return b.Bytes()
}

// End-to-end: scan a folder, then fetch the track over the loopback server with
// a Range request (the seek path) and fetch the album cover.
func TestMediaServerServesScannedFile(t *testing.T) {
	musicDir := t.TempDir()
	coversDir := t.TempDir()
	wavPath := filepath.Join(musicDir, "song.wav")
	if err := os.WriteFile(wavPath, makeWav(4096), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(musicDir, "cover.jpg"), []byte("\xff\xd8\xff\xe0jpeg-bytes"), 0o644); err != nil {
		t.Fatal(err)
	}

	ms, err := startMediaServer(coversDir)
	if err != nil {
		t.Fatal(err)
	}
	st, err := openStore(filepath.Join(t.TempDir(), "db.sqlite"), ms.baseURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = st.close() })
	ms.store = st

	files, scanned, err := scanFolder(musicDir, coversDir)
	if err != nil || scanned != 1 {
		t.Fatalf("scan: scanned=%d err=%v", scanned, err)
	}
	if _, _, err := st.scanUpsert(musicDir, files, 100); err != nil {
		t.Fatal(err)
	}

	tid := trackID(wavPath)

	// Full GET → 200 with the whole file.
	resp, err := http.Get(ms.baseURL + "/media/" + tid)
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK || len(body) == 0 {
		t.Fatalf("media GET: status=%d len=%d", resp.StatusCode, len(body))
	}

	// Range GET → 206 with exactly the requested slice + CORS header.
	req, _ := http.NewRequest(http.MethodGet, ms.baseURL+"/media/"+tid, nil)
	req.Header.Set("Range", "bytes=0-9")
	r2, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	slice, _ := io.ReadAll(r2.Body)
	r2.Body.Close()
	if r2.StatusCode != http.StatusPartialContent {
		t.Fatalf("range GET status=%d, want 206 (seek support)", r2.StatusCode)
	}
	if len(slice) != 10 {
		t.Fatalf("range slice len=%d, want 10", len(slice))
	}
	if r2.Header.Get("Access-Control-Allow-Origin") != "*" {
		t.Error("missing CORS header on media response")
	}

	// Cover (sibling cover.jpg, no embedded art) → 200.
	alid := albumID("Unknown Artist", "Unknown Album")
	cr, err := http.Get(ms.baseURL + "/cover/" + alid)
	if err != nil {
		t.Fatal(err)
	}
	cr.Body.Close()
	if cr.StatusCode != http.StatusOK {
		t.Fatalf("cover GET status=%d, want 200", cr.StatusCode)
	}
}

func TestMediaServerRejectsBadIDs(t *testing.T) {
	ms, err := startMediaServer(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	st, err := openStore(filepath.Join(t.TempDir(), "db.sqlite"), ms.baseURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = st.close() })
	ms.store = st

	for _, id := range []string{"../etc/passwd", "not-hex", "abc"} {
		resp, err := http.Get(ms.baseURL + "/media/" + id)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("media id %q status=%d, want 404 (non-hex id rejected)", id, resp.StatusCode)
		}
	}
}
