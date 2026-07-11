package media

import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/Tangerg/planet_new/backend/domain"
)

// streamURL builds the loopback /stream proxy URL for a remote source, mirroring
// what mediaURLs.stream does on the wire side.
func streamURL(s *Server, raw string) string {
	query := url.Values{}
	query.Set("token", s.streamToken)
	query.Set("url", raw)
	return s.BaseURL() + "/stream?" + query.Encode()
}

// fakeSource resolves any valid id to the same fixture file/ext.
type fakeSource struct {
	path string
	ext  string
}

func startTestServer(t *testing.T, coversDir string, source Source, options ...serverOptions) *Server {
	t.Helper()
	opts := serverOptions{}
	if len(options) > 0 {
		opts = options[0]
	}
	srv, err := start(coversDir, source, opts)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			t.Errorf("shutdown test server: %v", err)
		}
	})
	return srv
}

func (f fakeSource) TrackPath(context.Context, domain.TrackID) (string, error) {
	return f.path, nil
}
func (f fakeSource) AlbumCoverExt(context.Context, domain.AlbumID) (string, error) {
	return f.ext, nil
}

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

	srv := startTestServer(t, coversDir, fakeSource{path: audioPath, ext: "jpg"})

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
	srv := startTestServer(t, t.TempDir(), fakeSource{})
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

	srv := startTestServer(t, t.TempDir(), fakeSource{}, serverOptions{allowPrivateNetwork: true})
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

func TestStreamProxyPropagatesClientCancellationUpstream(t *testing.T) {
	started := make(chan struct{})
	cancelled := make(chan struct{})
	upstream := httptest.NewServer(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		close(started)
		<-r.Context().Done()
		close(cancelled)
	}))
	defer upstream.Close()

	srv := startTestServer(t, t.TempDir(), fakeSource{}, serverOptions{allowPrivateNetwork: true})
	ctx, cancel := context.WithCancel(context.Background())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, streamURL(srv, upstream.URL+"/slow.mp3"), nil)
	if err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() {
		resp, err := http.DefaultClient.Do(req)
		if resp != nil {
			resp.Body.Close()
		}
		done <- err
	}()
	<-started
	cancel()

	if err := <-done; !errors.Is(err, context.Canceled) {
		t.Fatalf("client error = %v, want context.Canceled", err)
	}
	select {
	case <-cancelled:
	case <-time.After(time.Second):
		t.Fatal("upstream request context was not cancelled")
	}
}

func TestServerRejectsInvalidStreamURL(t *testing.T) {
	srv := startTestServer(t, t.TempDir(), fakeSource{})
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

func TestServerRequiresStreamToken(t *testing.T) {
	srv := startTestServer(t, t.TempDir(), fakeSource{})
	unauthorized := srv.BaseURL() + "/stream?url=" + url.QueryEscape("https://example.com/song.mp3")
	resp, err := http.Get(unauthorized)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("unauthorized stream status=%d, want 404", resp.StatusCode)
	}
}

func TestServerRejectsPrivateStreamTargets(t *testing.T) {
	srv := startTestServer(t, t.TempDir(), fakeSource{})
	for _, raw := range []string{
		"http://127.0.0.1:8080/song.mp3",
		"http://10.0.0.1/song.mp3",
		"http://169.254.169.254/latest/meta-data",
		"http://[::1]/song.mp3",
	} {
		if got := srv.StreamURL(raw); got != "" {
			t.Errorf("StreamURL(%q) = %q, want fail-closed empty URL", raw, got)
		}
		resp, err := http.Get(streamURL(srv, raw))
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("private target %q status=%d, want 400", raw, resp.StatusCode)
		}
	}
}

func TestSafeDialRejectsPrivateDNSResults(t *testing.T) {
	dial := safeDialContext(&net.Dialer{Timeout: time.Second})
	conn, err := dial(context.Background(), "tcp", "localhost:80")
	if conn != nil {
		conn.Close()
	}
	if err == nil {
		t.Fatal("safe dial unexpectedly allowed localhost")
	}
}

func TestStreamURLCarriesOpaqueTokenAndEscapedTarget(t *testing.T) {
	srv := startTestServer(t, t.TempDir(), fakeSource{}, serverOptions{streamToken: "test-token"})
	raw := "https://cdn.example/song.mp3?br=320000&quality=lossless"
	wrapped := srv.StreamURL(raw)
	parsed, err := url.Parse(wrapped)
	if err != nil {
		t.Fatal(err)
	}
	if parsed.Query().Get("token") != "test-token" || parsed.Query().Get("url") != raw {
		t.Fatalf("wrapped stream query = %q, want token and exact target", parsed.RawQuery)
	}
}

func TestStreamURLLeavesOnlyOwnMediaURLsUnwrapped(t *testing.T) {
	srv := startTestServer(t, t.TempDir(), fakeSource{})
	local := srv.BaseURL() + "/media/" + validID
	if got := srv.StreamURL(local); got != local {
		t.Fatalf("own media URL = %q, want unchanged", got)
	}
	if got := srv.StreamURL(srv.BaseURL() + "/stream?url=https://example.com"); got != "" {
		t.Fatalf("untrusted local path = %q, want rejected", got)
	}
}

func TestStreamClientRejectsPrivateRedirectsAndDisablesEnvironmentProxy(t *testing.T) {
	client := newStreamClient(false)
	redirect, _ := http.NewRequest(http.MethodGet, "http://127.0.0.1/internal", nil)
	if err := client.CheckRedirect(redirect, nil); err == nil {
		t.Fatal("redirect policy allowed a private target")
	}
	transport, ok := client.Transport.(*http.Transport)
	if !ok {
		t.Fatalf("transport type = %T, want *http.Transport", client.Transport)
	}
	if transport.Proxy != nil {
		t.Fatal("stream transport must not delegate target routing to environment proxies")
	}
	if transport.TLSHandshakeTimeout <= 0 || transport.ResponseHeaderTimeout <= 0 {
		t.Fatal("stream transport is missing TLS/response-header timeouts")
	}
}

func TestServerRejectsUnsupportedStreamMethods(t *testing.T) {
	srv := startTestServer(t, t.TempDir(), fakeSource{})
	req, err := http.NewRequest(http.MethodPost, streamURL(srv, "https://example.com/song.mp3"), nil)
	if err != nil {
		t.Fatal(err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusMethodNotAllowed {
		t.Fatalf("POST /stream status=%d, want 405", resp.StatusCode)
	}
}

func TestServerShutdownIsIdempotentAndReleasesListener(t *testing.T) {
	srv, err := Start(t.TempDir(), fakeSource{})
	if err != nil {
		t.Fatal(err)
	}
	baseURL := srv.BaseURL()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		t.Fatal(err)
	}
	if err := srv.Shutdown(ctx); err != nil {
		t.Fatalf("second shutdown should be a no-op: %v", err)
	}

	client := http.Client{Timeout: 500 * time.Millisecond}
	if resp, err := client.Get(baseURL + "/media/" + validID); err == nil {
		resp.Body.Close()
		t.Fatal("media listener still accepted requests after shutdown")
	}
}
