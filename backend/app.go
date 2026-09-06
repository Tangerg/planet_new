// Package backend is the desktop shell's Go side: the composition root plus the
// Wails-bound interface adapter over the on-device music library. It wires the
// concrete infrastructure (SQLite catalog, folder scanner, loopback media
// server, native folder picker) into the framework-free `application` use cases
// and projects results to wire DTOs. Only this package is bound to Wails.
package backend

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/Tangerg/planet_new/backend/application"
	"github.com/Tangerg/planet_new/backend/media"
	"github.com/Tangerg/planet_new/backend/scan"
	"github.com/Tangerg/planet_new/backend/sqlite"

	wails "github.com/wailsapp/wails/v3/pkg/application"
)

// shutdownTimeout bounds the teardown Wails blocks on. The framework's shutdown
// hook takes no context, so the deadline is set here rather than by the caller.
const shutdownTimeout = 5 * time.Second

// The SQLite catalog also satisfies the media server's Source port.
var _ media.Source = (*sqlite.Catalog)(nil)

// App is the backend composition root: it owns the native resources and the
// lifetime of the work that uses them, and exposes the bound Library adapter to
// Wails.
type App struct {
	picker  *wailsFolderPicker
	library *Library
	infra   *runtimeInfra
	// stopWork ends the lifetime handed to the Library, cancelling in-flight
	// bound calls before their infrastructure is torn down underneath them.
	stopWork     context.CancelFunc
	shutdownMu   sync.Mutex
	shutdownDone bool
}

// runtimeInfra is the ownership boundary for native resources. Shutdown order
// is the reverse of construction: stop HTTP handlers that use the catalog, then
// close the catalog itself.
type runtimeInfra struct {
	catalog *sqlite.Catalog
	scanner *scan.Scanner
	media   *media.Server
}

func (i *runtimeInfra) shutdown(ctx context.Context) error {
	if i == nil {
		return nil
	}
	if i.media != nil {
		if err := i.media.Shutdown(ctx); err != nil {
			// Active handlers may still be using the catalog. Leave it open so a
			// later shutdown call with a fresh context can finish safely.
			return fmt.Errorf("stop media server: %w", err)
		}
	}
	if i.catalog != nil {
		if err := i.catalog.Close(); err != nil {
			return fmt.Errorf("close catalog: %w", err)
		}
	}
	return nil
}

type mediaStarter func(coversDir string, source media.Source) (*media.Server, error)

type wallClock struct{}

func (wallClock) Now() time.Time { return time.Now() }

// New wires the backend. Infrastructure failures are logged and leave the
// library inert (empty results / graceful errors) rather than aborting startup.
func New() *App {
	picker := &wailsFolderPicker{}
	lifetime, stopWork := context.WithCancel(context.Background())

	dataDir, err := defaultDataDir()
	var infra *runtimeInfra
	if err == nil {
		infra, err = openInfra(context.Background(), dataDir, media.Start)
	}
	var service *application.Service
	mediaBase := ""
	var streamProxy func(string) string
	if err != nil {
		fmt.Println("[backend] init failed:", err)
		// Inert: the ports we could not build stay nil, so their use cases
		// report unavailable while picking a folder still works.
		service = application.NewService(application.Config{
			Picker: picker,
			Clock:  wallClock{},
		})
	} else {
		service = application.NewService(application.Config{
			Catalog: infra.catalog,
			Scanner: infra.scanner,
			Picker:  picker,
			Lyrics:  scan.SidecarLyrics{},
			Clock:   wallClock{},
		})
		mediaBase = infra.media.BaseURL()
		streamProxy = infra.media.StreamURL
	}

	return &App{
		picker:   picker,
		library:  newLibrary(lifetime, service, mediaURLs{base: mediaBase, streamProxy: streamProxy}),
		infra:    infra,
		stopWork: stopWork,
	}
}

// Shutdown is wired to Wails' OnShutdown hook. The real work is kept in shutdown
// so package tests can assert errors while the framework callback stays func().
func (a *App) Shutdown() {
	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := a.shutdown(ctx); err != nil {
		fmt.Println("[backend] shutdown failed:", err)
	}
}

func (a *App) shutdown(ctx context.Context) error {
	if a == nil {
		return nil
	}
	a.shutdownMu.Lock()
	defer a.shutdownMu.Unlock()
	if a.shutdownDone {
		return nil
	}
	// Stop in-flight bound calls first. They hold the catalog and the media
	// server, so tearing those down underneath a running scan would abandon its
	// transaction instead of rolling it back.
	if a.stopWork != nil {
		a.stopWork()
	}
	if err := a.infra.shutdown(ctx); err != nil {
		return err
	}
	a.shutdownDone = true
	return nil
}

// Services is the set of instances exposed to the frontend over the JS bridge.
// Only the Library adapter is registered (the App/picker are internal wiring).
// Its errors are marshalled by marshalWireError, which is what puts the stable
// code + operation on the `cause` of the promise the frontend sees.
func (a *App) Services() []wails.Service {
	return []wails.Service{
		wails.NewServiceWithOptions(a.library, wails.ServiceOptions{MarshalError: marshalWireError}),
	}
}

func defaultDataDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, "PLANET"), nil
}

// openInfra opens the database + media server under dataDir. If construction
// fails after the catalog opens, it closes the catalog before returning so a
// degraded App never leaks a half-built resource graph.
func openInfra(ctx context.Context, dataDir string, startMedia mediaStarter) (_ *runtimeInfra, err error) {
	if dataDir == "" {
		return nil, errors.New("no user config directory")
	}
	coversDir := filepath.Join(dataDir, "covers")
	if err := os.MkdirAll(coversDir, 0o755); err != nil {
		return nil, err
	}
	catalog, err := sqlite.Open(ctx, filepath.Join(dataDir, "library.db"))
	if err != nil {
		return nil, err
	}
	owned := false
	defer func() {
		if !owned {
			_ = catalog.Close()
		}
	}()

	server, err := startMedia(coversDir, catalog) // catalog satisfies media.Source
	if err != nil {
		return nil, err
	}
	owned = true
	return &runtimeInfra{catalog: catalog, scanner: scan.New(coversDir), media: server}, nil
}
