// Package backend is the desktop shell's Go side: the composition root plus the
// Wails-bound interface adapter over the on-device music library. It wires the
// concrete infrastructure (SQLite catalog, folder scanner, loopback media
// server, native folder picker) into the framework-free `application` use cases
// and projects results to wire DTOs. Only this package is bound to Wails.
package backend

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"changeme/backend/application"
	"changeme/backend/media"
	"changeme/backend/scan"
	"changeme/backend/sqlite"
)

// The SQLite catalog also satisfies the media server's Source port.
var _ media.Source = (*sqlite.Catalog)(nil)

// App is the backend composition root: it owns the runtime-context lifecycle and
// exposes the bound Library adapter to Wails.
type App struct {
	picker  *wailsFolderPicker
	library *Library
}

// New wires the backend. Infrastructure failures are logged and leave the
// library inert (empty results / graceful errors) rather than aborting startup.
func New() *App {
	picker := &wailsFolderPicker{}

	catalog, scanner, mediaBase, err := openInfra()
	var service *application.Service
	if err != nil {
		fmt.Println("[backend] init failed:", err)
		service = application.NewService(nil, nil, picker) // inert: reads report unavailable
	} else {
		service = application.NewService(catalog, scanner, picker)
	}

	return &App{
		picker:  picker,
		library: newLibrary(service, mediaURLs{base: mediaBase}),
	}
}

// Startup captures the Wails runtime context for the native folder dialog.
func (a *App) Startup(ctx context.Context) { a.picker.attach(ctx) }

// Bind is the set of instances exposed to the frontend over the JS bridge. Only
// the Library adapter is bound (the App/picker are internal wiring).
func (a *App) Bind() []any { return []any{a.library} }

// openInfra opens the database + media server under the OS app-config dir and
// returns the pieces the application service needs.
func openInfra() (catalog *sqlite.Catalog, scanner *scan.Scanner, mediaBase string, err error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return nil, nil, "", err
	}
	dataDir := filepath.Join(base, "PLANET")
	coversDir := filepath.Join(dataDir, "covers")
	if err := os.MkdirAll(coversDir, 0o755); err != nil {
		return nil, nil, "", err
	}
	catalog, err = sqlite.Open(filepath.Join(dataDir, "library.db"))
	if err != nil {
		return nil, nil, "", err
	}
	server, err := media.Start(coversDir, catalog) // catalog satisfies media.Source
	if err != nil {
		return nil, nil, "", err
	}
	return catalog, scan.New(coversDir), server.BaseURL(), nil
}
