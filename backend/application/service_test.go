package application

import (
	"testing"

	"changeme/backend/domain"
)

// ── fakes (the ports) ────────────────────────────────────────────────────────

type fakeCatalog struct {
	albums     []domain.Album
	artists    []domain.Artist
	recent     []domain.Track
	savedMetas []domain.TrackMetadata
	savedAt    int64
	added      int
	total      int
}

func (f *fakeCatalog) Save(folder string, metas []domain.TrackMetadata, at int64) (int, int, error) {
	f.savedMetas = metas
	f.savedAt = at
	return f.added, f.total, nil
}
func (f *fakeCatalog) Count() (int, error)               { return f.total, nil }
func (f *fakeCatalog) Albums() ([]domain.Album, error)   { return f.albums, nil }
func (f *fakeCatalog) Artists() ([]domain.Artist, error) { return f.artists, nil }
func (f *fakeCatalog) Album(domain.AlbumID) (*domain.Album, error) {
	if len(f.albums) == 0 {
		return nil, nil
	}
	return &f.albums[0], nil
}
func (f *fakeCatalog) Artist(domain.ArtistID) (*domain.Artist, error)         { return nil, nil }
func (f *fakeCatalog) AlbumsByArtist(domain.ArtistID) ([]domain.Album, error) { return f.albums, nil }
func (f *fakeCatalog) AllTracks() ([]domain.Track, error)                     { return f.recent, nil }
func (f *fakeCatalog) RecentTracks(int) ([]domain.Track, error)               { return f.recent, nil }
func (f *fakeCatalog) Tracks([]domain.TrackID) ([]domain.Track, error)        { return f.recent, nil }
func (f *fakeCatalog) TracksByAlbum(domain.AlbumID) ([]domain.Track, error)   { return f.recent, nil }
func (f *fakeCatalog) TracksByArtist(domain.ArtistID) ([]domain.Track, error) { return f.recent, nil }
func (f *fakeCatalog) Search(string, int) (domain.SearchResult, error) {
	return domain.SearchResult{Tracks: f.recent, Albums: f.albums, Artists: f.artists}, nil
}

type fakeScanner struct {
	metas []domain.TrackMetadata
	seen  int
}

func (f fakeScanner) Scan(string) ([]domain.TrackMetadata, int, error) {
	return f.metas, f.seen, nil
}

type fakePicker struct{ folder string }

func (p fakePicker) Pick() (string, error) { return p.folder, nil }

// ── tests ────────────────────────────────────────────────────────────────────

func TestScanFolderOrchestratesScannerIntoCatalog(t *testing.T) {
	cat := &fakeCatalog{added: 2, total: 5}
	scanner := fakeScanner{metas: []domain.TrackMetadata{{Path: "/m/a.mp3"}, {Path: "/m/b.mp3"}, {Path: "/m/c.mp3"}}, seen: 3}
	svc := NewService(cat, scanner, fakePicker{})

	report, err := svc.ScanFolder("/m")
	if err != nil {
		t.Fatal(err)
	}
	if report.Folder != "/m" || report.Scanned != 3 || report.Added != 2 || report.Total != 5 {
		t.Errorf("report = %+v, want {/m 3 2 5}", report)
	}
	if len(cat.savedMetas) != 3 {
		t.Errorf("catalog received %d metas, want the scanner's 3", len(cat.savedMetas))
	}
	if cat.savedAt == 0 {
		t.Error("Save should get a scan timestamp")
	}
}

func TestPickAndScanUsesPickerThenScans(t *testing.T) {
	cat := &fakeCatalog{added: 1, total: 1}
	svc := NewService(cat, fakeScanner{seen: 1}, fakePicker{folder: "/chosen"})

	report, err := svc.PickAndScan()
	if err != nil {
		t.Fatal(err)
	}
	if report.Folder != "/chosen" {
		t.Errorf("scanned folder = %q, want the picked one", report.Folder)
	}
}

func TestPickAndScanCancelledIsNoOp(t *testing.T) {
	cat := &fakeCatalog{}
	svc := NewService(cat, fakeScanner{}, fakePicker{folder: ""}) // user cancelled

	report, err := svc.PickAndScan()
	if err != nil {
		t.Fatal(err)
	}
	if report.Folder != "" {
		t.Errorf("cancel should yield a zero report, got %+v", report)
	}
	if cat.savedMetas != nil {
		t.Error("cancel must not touch the catalog")
	}
}

func TestHomeComposesCatalogReads(t *testing.T) {
	cat := &fakeCatalog{
		albums:  []domain.Album{{ID: "a"}},
		artists: []domain.Artist{{ID: "ar"}},
		recent:  []domain.Track{{ID: "t"}},
	}
	home, err := NewService(cat, fakeScanner{}, fakePicker{}).Home()
	if err != nil {
		t.Fatal(err)
	}
	if len(home.Recent) != 1 || len(home.Albums) != 1 || len(home.Artists) != 1 {
		t.Errorf("home = %+v, want one of each", home)
	}
}

func TestUnavailableWhenCatalogNil(t *testing.T) {
	svc := NewService(nil, nil, fakePicker{}) // infra failed to open

	if _, err := svc.Home(); err != ErrUnavailable {
		t.Errorf("Home err = %v, want ErrUnavailable", err)
	}
	if _, err := svc.ScanFolder("/x"); err != ErrUnavailable {
		t.Errorf("ScanFolder err = %v, want ErrUnavailable", err)
	}
}
