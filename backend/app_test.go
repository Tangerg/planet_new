package backend

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/Tangerg/planet_new/backend/application"
	"github.com/Tangerg/planet_new/backend/media"
	"github.com/Tangerg/planet_new/backend/sqlite"
)

func TestOpenInfraRollsBackCatalogWhenMediaStartFails(t *testing.T) {
	startErr := errors.New("media bind failed")
	var openedCatalog *sqlite.Catalog

	infra, err := openInfra(context.Background(), t.TempDir(), func(_ string, source media.Source) (*media.Server, error) {
		openedCatalog = source.(*sqlite.Catalog)
		return nil, startErr
	})
	if !errors.Is(err, startErr) {
		t.Fatalf("openInfra error = %v, want media start error", err)
	}
	if infra != nil {
		t.Fatalf("openInfra returned half-built resources: %+v", infra)
	}
	if openedCatalog == nil {
		t.Fatal("test media starter never received the opened catalog")
	}
	if _, err := openedCatalog.Count(context.Background()); err == nil {
		t.Fatal("catalog remained usable after media startup failed")
	}
}

func TestAppShutdownClosesMediaBeforeCatalogAndIsIdempotent(t *testing.T) {
	infra, err := openInfra(context.Background(), t.TempDir(), media.Start)
	if err != nil {
		t.Fatal(err)
	}
	app := &App{infra: infra}
	baseURL := infra.media.BaseURL()

	resp, err := http.Get(baseURL + "/media/not-an-id")
	if err != nil {
		t.Fatalf("media server was not listening before shutdown: %v", err)
	}
	resp.Body.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := app.shutdown(ctx); err != nil {
		t.Fatal(err)
	}
	if err := app.shutdown(ctx); err != nil {
		t.Fatalf("second app shutdown should be a no-op: %v", err)
	}
	if _, err := infra.catalog.Count(context.Background()); err == nil {
		t.Fatal("catalog remained usable after app shutdown")
	}

	client := http.Client{Timeout: 500 * time.Millisecond}
	if resp, err := client.Get(baseURL + "/media/0123456789abcdef"); err == nil {
		resp.Body.Close()
		t.Fatal("media listener still accepted requests after app shutdown")
	}
}

// Shutdown has to reach work that is already running, not just close resources:
// a scan caught by a quit must be cancelled so it rolls its transaction back
// instead of writing into a catalog that is closing underneath it.
func TestAppShutdownEndsTheWorkLifetimeBeforeClosingInfrastructure(t *testing.T) {
	infra, err := openInfra(context.Background(), t.TempDir(), media.Start)
	if err != nil {
		t.Fatal(err)
	}
	lifetime, stopWork := context.WithCancel(context.Background())
	service := application.NewService(infra.catalog, infra.scanner, nil, nil, wallClock{})
	library := newLibrary(lifetime, service, mediaURLs{})
	app := &App{library: library, infra: infra, stopWork: stopWork}

	inFlight, done := library.callScope(context.Background())
	defer done()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := app.shutdown(ctx); err != nil {
		t.Fatal(err)
	}

	select {
	case <-inFlight.Done():
	case <-time.After(2 * time.Second):
		t.Fatal("shutdown closed infrastructure without cancelling in-flight bound calls")
	}
}
