// Package media streams local audio + cover art to the webview over a loopback
// HTTP server. A standalone net/http server (rather than the Wails asset
// handler) is deliberate: http.ServeContent gives real HTTP Range / seek
// support, and the same absolute URL works in `wails dev` and a production
// build, sidestepping the asset handler's media/range divergences.
package media

import (
	"net"
	"net/http"
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

// Server owns the loopback listener and serves /media/<id> and /cover/<albumId>.
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

// cors lets the webview origin load media cross-origin; loopback is a trusted
// origin, so a permissive header is fine and keeps a Web-Audio analyser tap from
// tainting.
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next.ServeHTTP(w, r)
	})
}
