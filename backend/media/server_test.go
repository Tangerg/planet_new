package media

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"testing"

	"changeme/backend/domain"
)

// streamURL builds the loopback /stream proxy URL for a remote source, mirroring
// what mediaURLs.stream does on the wire side.
func streamURL(s *Server, raw string) string {
	return s.BaseURL() + "/stream?url=" + url.QueryEscape(raw)
}

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

func TestServerProxiesStreamAudioWithRangeAndCORS(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Range") != "bytes=2-5" {
			t.Errorf("upstream Range = %q, want bytes=2-5", r.Header.Get("Range"))
		}
		w.Header().Set("Content-Type", "audio/mpeg")
		w.Header().Set("Accept-Ranges", "bytes")
		w.Header().Set("Content-Range", "bytes 2-5/10")
		w.WriteHeader(http.StatusPartialContent)
		_, _ = w.Write([]byte("cdef"))
	}))
	defer upstream.Close()

	srv, err := Start(t.TempDir(), fakeSource{})
	if err != nil {
		t.Fatal(err)
	}
	req, _ := http.NewRequest(http.MethodGet, streamURL(srv, upstream.URL+"/song.mp3"), nil)
	req.Header.Set("Range", "bytes=2-5")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	resp.Body.Close()

	if resp.StatusCode != http.StatusPartialContent || string(body) != "cdef" {
		t.Fatalf("stream proxy: status=%d body=%q, want 206/cdef", resp.StatusCode, body)
	}
	if resp.Header.Get("Access-Control-Allow-Origin") != "*" {
		t.Error("missing CORS header on stream response")
	}
	if resp.Header.Get("Content-Range") != "bytes 2-5/10" {
		t.Errorf("Content-Range = %q, want upstream value", resp.Header.Get("Content-Range"))
	}
}

func TestServerRejectsInvalidStreamURL(t *testing.T) {
	srv, err := Start(t.TempDir(), fakeSource{})
	if err != nil {
		t.Fatal(err)
	}
	for _, raw := range []string{"", "file:///tmp/song.mp3", "ftp://example.com/song.mp3"} {
		resp, err := http.Get(streamURL(srv, raw))
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("stream url %q status=%d, want 400", raw, resp.StatusCode)
		}
	}
}
