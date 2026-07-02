package library

import (
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
)

// mediaServer streams local audio + cover art to the webview over loopback.
// A standalone net/http server (rather than the Wails asset handler) is used
// deliberately: http.ServeContent gives real HTTP Range / seek support and the
// same absolute URL works identically in `wails dev` and a production build,
// sidestepping the asset-handler media/range divergences.
type mediaServer struct {
	listener  net.Listener
	baseURL   string
	coversDir string
	store     *store // wired after the DB opens
}

// idPattern guards the path params: our ids are 16 hex chars, so anything else
// is rejected before it can touch the filesystem (no traversal).
var idPattern = regexp.MustCompile(`^[0-9a-f]{16}$`)

func startMediaServer(coversDir string) (*mediaServer, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0") // ephemeral loopback port
	if err != nil {
		return nil, err
	}
	ms := &mediaServer{
		listener:  ln,
		baseURL:   "http://" + ln.Addr().String(),
		coversDir: coversDir,
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/media/", ms.serveMedia)
	mux.HandleFunc("/cover/", ms.serveCover)
	srv := &http.Server{Handler: cors(mux)}
	go func() { _ = srv.Serve(ln) }()
	return ms, nil
}

func (ms *mediaServer) serveMedia(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/media/"):]
	if !idPattern.MatchString(id) || ms.store == nil {
		http.NotFound(w, r)
		return
	}
	path, err := ms.store.trackPath(id)
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

func (ms *mediaServer) serveCover(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/cover/"):]
	if !idPattern.MatchString(id) || ms.store == nil {
		http.NotFound(w, r)
		return
	}
	ext, err := ms.store.albumCoverExt(id)
	if err != nil || ext == "" {
		http.NotFound(w, r)
		return
	}
	http.ServeFile(w, r, filepath.Join(ms.coversDir, id+"."+ext))
}

// cors allows the webview origin (wails.localhost / the Vite dev origin) to load
// media cross-origin; loopback is a trusted origin so a permissive header is
// fine and keeps a Web-Audio analyser tap from tainting.
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next.ServeHTTP(w, r)
	})
}
