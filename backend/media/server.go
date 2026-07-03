// Package media streams local audio + cover art to the webview over a loopback
// HTTP server. A standalone net/http server (rather than the Wails asset
// handler) is deliberate: http.ServeContent gives real HTTP Range / seek
// support, and the same absolute URL works in `wails dev` and a production
// build, sidestepping the asset handler's media/range divergences.
package media

import (
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"

	"changeme/backend/domain"
)

// Source is what the server needs from the catalog: resolve an id to a file.
// Defined here (the consumer) so the server depends on a minimal port, not the
// whole repository.
type Source interface {
	TrackPath(domain.TrackID) (string, error)
	AlbumCoverExt(domain.AlbumID) (string, error)
}

// idPattern guards path params: ids are 16 hex chars, so anything else is
// rejected before it can touch the filesystem (no traversal).
var idPattern = regexp.MustCompile(`^[0-9a-f]{16}$`)

// Server owns the loopback listener and serves /media/<id>, /cover/<albumId>,
// plus /stream?url=<remote>: a CORS byte-proxy that turns a remote provider URL
// into a loopback (CORS-clean) one, so the webview can play it AND feed it to
// Web Audio without cross-origin tainting.
type Server struct {
	baseURL   string
	coversDir string
	source    Source
}

// Start binds an ephemeral loopback port and begins serving.
func Start(coversDir string, source Source) (*Server, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	s := &Server{
		baseURL:   "http://" + ln.Addr().String(),
		coversDir: coversDir,
		source:    source,
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/media/", s.serveMedia)
	mux.HandleFunc("/cover/", s.serveCover)
	mux.HandleFunc("/stream", s.serveStream)
	srv := &http.Server{Handler: cors(mux)}
	go func() { _ = srv.Serve(ln) }()
	return s, nil
}

// BaseURL is the origin the frontend loads media from (http://127.0.0.1:<port>).
func (s *Server) BaseURL() string { return s.baseURL }

func (s *Server) serveMedia(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/media/"):]
	if !idPattern.MatchString(id) {
		http.NotFound(w, r)
		return
	}
	path, err := s.source.TrackPath(domain.TrackID(id))
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
	ext, err := s.source.AlbumCoverExt(domain.AlbumID(id))
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
	raw := r.URL.Query().Get("url")
	target, err := url.Parse(raw)
	if err != nil || target.Host == "" || (target.Scheme != "http" && target.Scheme != "https") {
		http.Error(w, "invalid stream url", http.StatusBadRequest)
		return
	}

	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, target.String(), nil)
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

	resp, err := http.DefaultClient.Do(req)
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
