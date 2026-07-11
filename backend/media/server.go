// Package media streams local audio + cover art to the webview over a loopback
// HTTP server. A standalone net/http server (rather than the Wails asset
// handler) is deliberate: http.ServeContent gives real HTTP Range / seek
// support, and the same absolute URL works in `wails dev` and a production
// build, sidestepping the asset handler's media/range divergences.
package media

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/Tangerg/planet_new/backend/domain"
)

// Source is what the server needs from the catalog: resolve an id to a file.
// Defined here (the consumer) so the server depends on a minimal port, not the
// whole repository.
type Source interface {
	TrackPath(context.Context, domain.TrackID) (string, error)
	AlbumCoverExt(context.Context, domain.AlbumID) (string, error)
}

// idPattern guards path params: ids are 16 hex chars, so anything else is
// rejected before it can touch the filesystem (no traversal).
var idPattern = regexp.MustCompile(`^[0-9a-f]{16}$`)

// Server owns the loopback listener and serves /media/<id>, /cover/<albumId>,
// plus an authenticated /stream byte-proxy that turns a public remote provider
// URL into a loopback (CORS-clean) one. Private destinations are denied and DNS
// is resolved on the guarded dial path to prevent SSRF/rebinding bypasses.
type Server struct {
	baseURL             string
	coversDir           string
	source              Source
	streamToken         string
	allowPrivateNetwork bool
	client              *http.Client
	httpServer          *http.Server
	shutdownMu          sync.Mutex
	stopped             bool
}

type serverOptions struct {
	allowPrivateNetwork bool // test seam; production always keeps this false
	streamToken         string
}

var additionallyDeniedPrefixes = []netip.Prefix{
	netip.MustParsePrefix("100.64.0.0/10"), // carrier-grade NAT
	netip.MustParsePrefix("198.18.0.0/15"), // benchmark networks
}

// Start binds an ephemeral loopback port and begins serving.
func Start(coversDir string, source Source) (*Server, error) {
	return start(coversDir, source, serverOptions{})
}

func start(coversDir string, source Source, opts serverOptions) (*Server, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	token := opts.streamToken
	if token == "" {
		token, err = newStreamToken()
		if err != nil {
			_ = ln.Close()
			return nil, err
		}
	}
	s := &Server{
		baseURL:             "http://" + ln.Addr().String(),
		coversDir:           coversDir,
		source:              source,
		streamToken:         token,
		allowPrivateNetwork: opts.allowPrivateNetwork,
		client:              newStreamClient(opts.allowPrivateNetwork),
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/media/", s.serveMedia)
	mux.HandleFunc("/cover/", s.serveCover)
	mux.HandleFunc("/stream", s.serveStream)
	s.httpServer = &http.Server{
		Handler:           cors(mux),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    32 << 10,
	}
	go func() { _ = s.httpServer.Serve(ln) }()
	return s, nil
}

// BaseURL is the origin the frontend loads media from (http://127.0.0.1:<port>).
func (s *Server) BaseURL() string { return s.baseURL }

// StreamURL wraps a remote audio URL in the authenticated loopback proxy. The
// random token is never exposed as a standalone API; only URLs produced here
// can reach /stream. Invalid or private literal targets return an empty URL so
// the optional analysis probe can fail closed without affecting audible audio.
func (s *Server) StreamURL(raw string) string {
	if raw == "" || isOwnMediaURL(raw, s.baseURL) {
		return raw
	}
	if _, err := validateStreamTarget(raw, s.allowPrivateNetwork); err != nil {
		return ""
	}
	query := url.Values{}
	query.Set("token", s.streamToken)
	query.Set("url", raw)
	return s.baseURL + "/stream?" + query.Encode()
}

// Shutdown stops accepting new loopback requests and waits for active handlers
// to return. It is idempotent so both failed-startup rollback and Wails teardown
// can safely converge on the same ownership path.
func (s *Server) Shutdown(ctx context.Context) error {
	if s == nil || s.httpServer == nil {
		return nil
	}
	s.shutdownMu.Lock()
	defer s.shutdownMu.Unlock()
	if s.stopped {
		return nil
	}
	if err := s.httpServer.Shutdown(ctx); err != nil {
		return err
	}
	if transport, ok := s.client.Transport.(*http.Transport); ok {
		transport.CloseIdleConnections()
	}
	s.stopped = true
	return nil
}

func isOwnMediaURL(raw, base string) bool {
	target, targetErr := url.Parse(raw)
	origin, originErr := url.Parse(base)
	return targetErr == nil && originErr == nil &&
		target.Scheme == origin.Scheme && target.Host == origin.Host &&
		strings.HasPrefix(target.EscapedPath(), "/media/")
}

func (s *Server) serveMedia(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/media/"):]
	if !idPattern.MatchString(id) {
		http.NotFound(w, r)
		return
	}
	path, err := s.source.TrackPath(r.Context(), domain.TrackID(id))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	f, err := os.Open(path)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()
	stat, err := f.Stat()
	if err != nil {
		http.NotFound(w, r)
		return
	}
	// ServeContent negotiates Range/206 and content-type from the file name.
	http.ServeContent(w, r, filepath.Base(path), stat.ModTime(), f)
}

func (s *Server) serveCover(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/cover/"):]
	if !idPattern.MatchString(id) {
		http.NotFound(w, r)
		return
	}
	ext, err := s.source.AlbumCoverExt(r.Context(), domain.AlbumID(id))
	if err != nil || ext == "" {
		http.NotFound(w, r)
		return
	}
	http.ServeFile(w, r, filepath.Join(s.coversDir, id+"."+ext))
}

// serveStream is a CORS byte-proxy for a remote audio URL: it forwards the
// client's Range so seek/206 keeps working, relays the upstream's content
// headers, and (via the cors wrapper) adds the loopback ACAO so the webview can
// both play it and feed it to a Web Audio analyser untainted.
func (s *Server) serveStream(w http.ResponseWriter, r *http.Request) {
	if subtle.ConstantTimeCompare([]byte(r.URL.Query().Get("token")), []byte(s.streamToken)) != 1 {
		http.NotFound(w, r)
		return
	}
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	raw := r.URL.Query().Get("url")
	target, err := validateStreamTarget(raw, s.allowPrivateNetwork)
	if err != nil {
		http.Error(w, "invalid stream url", http.StatusBadRequest)
		return
	}

	req, err := http.NewRequestWithContext(r.Context(), r.Method, target.String(), nil)
	if err != nil {
		http.Error(w, "invalid stream request", http.StatusBadRequest)
		return
	}
	if rng := r.Header.Get("Range"); rng != "" {
		req.Header.Set("Range", rng)
	}
	if ua := r.UserAgent(); ua != "" {
		req.Header.Set("User-Agent", ua)
	} else {
		req.Header.Set("User-Agent", "Mozilla/5.0 PlanetMusic/1.0")
	}

	resp, err := s.client.Do(req)
	if err != nil {
		http.Error(w, "stream source unavailable", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	copyHeaders(w.Header(), resp.Header, []string{
		"Accept-Ranges",
		"Cache-Control",
		"Content-Length",
		"Content-Range",
		"Content-Type",
		"ETag",
		"Last-Modified",
	})
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func newStreamToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generate stream token: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func validateStreamTarget(raw string, allowPrivate bool) (*url.URL, error) {
	target, err := url.Parse(raw)
	if err != nil || target.Host == "" || (target.Scheme != "http" && target.Scheme != "https") {
		return nil, errors.New("stream target must be an absolute HTTP(S) URL")
	}
	if target.User != nil {
		return nil, errors.New("stream target credentials are not allowed")
	}
	if !allowPrivate {
		if addr, err := netip.ParseAddr(target.Hostname()); err == nil && isDeniedAddress(addr) {
			return nil, errors.New("stream target is not publicly routable")
		}
	}
	return target, nil
}

func isDeniedAddress(addr netip.Addr) bool {
	addr = addr.Unmap()
	if !addr.IsGlobalUnicast() || addr.IsPrivate() || addr.IsLoopback() || addr.IsLinkLocalUnicast() {
		return true
	}
	for _, prefix := range additionallyDeniedPrefixes {
		if prefix.Contains(addr) {
			return true
		}
	}
	return false
}

func newStreamClient(allowPrivate bool) *http.Client {
	dialer := &net.Dialer{Timeout: 5 * time.Second, KeepAlive: 30 * time.Second}
	transport := &http.Transport{
		Proxy:                 nil,
		DialContext:           dialer.DialContext,
		ForceAttemptHTTP2:     true,
		MaxIdleConns:          20,
		IdleConnTimeout:       60 * time.Second,
		TLSHandshakeTimeout:   5 * time.Second,
		ResponseHeaderTimeout: 10 * time.Second,
	}
	if !allowPrivate {
		transport.DialContext = safeDialContext(dialer)
	}
	return &http.Client{
		Transport: transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return errors.New("too many stream redirects")
			}
			_, err := validateStreamTarget(req.URL.String(), allowPrivate)
			return err
		},
	}
}

func safeDialContext(dialer *net.Dialer) func(context.Context, string, string) (net.Conn, error) {
	return func(ctx context.Context, network, address string) (net.Conn, error) {
		host, port, err := net.SplitHostPort(address)
		if err != nil {
			return nil, err
		}
		addresses, err := net.DefaultResolver.LookupNetIP(ctx, "ip", host)
		if err != nil {
			return nil, err
		}
		if len(addresses) == 0 {
			return nil, errors.New("stream target resolved to no addresses")
		}
		for _, addr := range addresses {
			if isDeniedAddress(addr) {
				return nil, fmt.Errorf("stream target resolved to denied address %s", addr)
			}
		}
		return dialer.DialContext(ctx, network, net.JoinHostPort(addresses[0].Unmap().String(), port))
	}
}

func copyHeaders(dst, src http.Header, names []string) {
	for _, name := range names {
		for _, value := range src.Values(name) {
			dst.Add(name, value)
		}
	}
}

// cors lets the webview origin load media cross-origin; loopback is a trusted
// origin, so a permissive header is fine and keeps a Web-Audio analyser tap from
// tainting.
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next.ServeHTTP(w, r)
	})
}
