package media

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"changeme/library/domain"
)

// fakeSource resolves any valid id to the same fixture file/ext.
type fakeSource struct {
	path string
	ext  string
}

func (f fakeSource) TrackPath(domain.TrackID) (string, error)     { return f.path, nil }
func (f fakeSource) AlbumCoverExt(domain.AlbumID) (string, error) { return f.ext, nil }

const validID = "0123456789abcdef"

func TestServerStreamsWithRangeAndCORS(t *testing.T) {
	coversDir := t.TempDir()
	audioPath := filepath.Join(t.TempDir(), "song.wav")
	if err := os.WriteFile(audioPath, make([]byte, 4096), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(coversDir, validID+".jpg"), []byte("art"), 0o644); err != nil {
		t.Fatal(err)
	}

	srv, err := Start(coversDir, fakeSource{path: audioPath, ext: "jpg"})
	if err != nil {
		t.Fatal(err)
	}

	// Full GET.
	resp, err := http.Get(srv.BaseURL() + "/media/" + validID)
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK || len(body) != 4096 {
		t.Fatalf("media GET: status=%d len=%d", resp.StatusCode, len(body))
	}

	// Range GET → 206 with exactly the requested slice + CORS header.
	req, _ := http.NewRequest(http.MethodGet, srv.BaseURL()+"/media/"+validID, nil)
	req.Header.Set("Range", "bytes=0-9")
	r2, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	slice, _ := io.ReadAll(r2.Body)
	r2.Body.Close()
	if r2.StatusCode != http.StatusPartialContent || len(slice) != 10 {
		t.Fatalf("range GET: status=%d len=%d, want 206/10 (seek support)", r2.StatusCode, len(slice))
	}
	if r2.Header.Get("Access-Control-Allow-Origin") != "*" {
		t.Error("missing CORS header on media response")
	}

	// Cover.
	cr, err := http.Get(srv.BaseURL() + "/cover/" + validID)
	if err != nil {
		t.Fatal(err)
	}
	cr.Body.Close()
	if cr.StatusCode != http.StatusOK {
		t.Fatalf("cover GET status=%d, want 200", cr.StatusCode)
	}
}

func TestServerRejectsBadIDs(t *testing.T) {
	srv, err := Start(t.TempDir(), fakeSource{})
	if err != nil {
		t.Fatal(err)
	}
	for _, id := range []string{"../etc/passwd", "not-hex", "abc"} {
		resp, err := http.Get(srv.BaseURL() + "/media/" + id)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("media id %q status=%d, want 404", id, resp.StatusCode)
		}
	}
}
