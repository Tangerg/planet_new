package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Tangerg/planet_new/backend/domain"
)

// ── fakes (the ports) ────────────────────────────────────────────────────────

type fakeCatalog struct {
	albums    []domain.Album
	artists   []domain.Artist
	recent    []domain.Track
	savedScan *domain.ScanSnapshot
	savedAt   int64
	added     int
	total     int
	path      string // TrackPath result
	pathErr   error
}

func (f *fakeCatalog) Save(_ context.Context, folder string, scan domain.ScanSnapshot, at int64) (int, int, error) {
	f.savedScan = &scan
	f.savedAt = at
	return f.added, f.total, nil
}
func (f *fakeCatalog) Count(context.Context) (int, error)               { return f.total, nil }
func (f *fakeCatalog) Albums(context.Context) ([]domain.Album, error)   { return f.albums, nil }
func (f *fakeCatalog) Artists(context.Context) ([]domain.Artist, error) { return f.artists, nil }
func (f *fakeCatalog) Album(context.Context, domain.AlbumID) (*domain.Album, error) {
	if len(f.albums) == 0 {
		return nil, nil
	}
	return &f.albums[0], nil
}
func (f *fakeCatalog) Artist(context.Context, domain.ArtistID) (*domain.Artist, error) {
	if len(f.artists) == 0 {
		return nil, nil
	}
	return &f.artists[0], nil
}
func (f *fakeCatalog) AlbumsByArtist(context.Context, domain.ArtistID) ([]domain.Album, error) {
	return f.albums, nil
}
func (f *fakeCatalog) AllTracks(context.Context) ([]domain.Track, error) { return f.recent, nil }
func (f *fakeCatalog) RecentTracks(context.Context, int) ([]domain.Track, error) {
	return f.recent, nil
}
func (f *fakeCatalog) Tracks(context.Context, []domain.TrackID) ([]domain.Track, error) {
	return f.recent, nil
}
func (f *fakeCatalog) TracksByAlbum(context.Context, domain.AlbumID) ([]domain.Track, error) {
	return f.recent, nil
}
func (f *fakeCatalog) TracksByArtist(context.Context, domain.ArtistID) ([]domain.Track, error) {
	return f.recent, nil
}
func (f *fakeCatalog) Search(context.Context, string, int) (domain.SearchResult, error) {
	return domain.SearchResult{Tracks: f.recent, Albums: f.albums, Artists: f.artists}, nil
}
func (f *fakeCatalog) TrackPath(context.Context, domain.TrackID) (string, error) {
	return f.path, f.pathErr
}

// fakeLyrics maps an audio path to its sidecar lyric text; unknown paths yield "".
type fakeLyrics struct{ byPath map[string]string }

func (f fakeLyrics) Lyric(_ context.Context, audioPath string) (string, error) {
	return f.byPath[audioPath], nil
}

type fakeScanner struct {
	snapshot domain.ScanSnapshot
	err      error
}

type blockingScanner struct {
	started chan struct{}
	release chan struct{}
}

func (s blockingScanner) Scan(ctx context.Context, _ string) (domain.ScanSnapshot, error) {
	close(s.started)
	select {
	case <-s.release:
		return domain.ScanSnapshot{Completeness: domain.ScanComplete}, nil
	case <-ctx.Done():
		return domain.ScanSnapshot{}, ctx.Err()
	}
}

func (f fakeScanner) Scan(ctx context.Context, _ string) (domain.ScanSnapshot, error) {
	if err := ctx.Err(); err != nil {
		return domain.ScanSnapshot{}, err
	}
	return f.snapshot, f.err
}

type fakePicker struct{ folder string }

func (p fakePicker) Pick(context.Context) (string, error) { return p.folder, nil }

type fixedClock struct{}

const fixedNowMillis int64 = 1_700_000_000_123

func (fixedClock) Now() time.Time { return time.UnixMilli(fixedNowMillis) }

// ── tests ────────────────────────────────────────────────────────────────────

func TestScanFolderOrchestratesScannerIntoCatalog(t *testing.T) {
	cat := &fakeCatalog{added: 2, total: 5}
	scanner := fakeScanner{snapshot: domain.ScanSnapshot{
		Metadata:     []domain.TrackMetadata{{Path: "/m/a.mp3"}, {Path: "/m/b.mp3"}, {Path: "/m/c.mp3"}},
		FilesSeen:    3,
		Completeness: domain.ScanComplete,
	}}
	svc := NewService(cat, scanner, fakePicker{}, fakeLyrics{}, fixedClock{})

	report, err := svc.ScanFolder(context.Background(), "/m")
	if err != nil {
		t.Fatal(err)
	}
	if report.Folder != "/m" || report.Scanned != 3 || report.Added != 2 || report.Total != 5 {
		t.Errorf("report = %+v, want {/m 3 2 5}", report)
	}
	if cat.savedScan == nil || len(cat.savedScan.Metadata) != 3 {
		t.Fatalf("catalog received scan = %+v, want the scanner's 3 metadata rows", cat.savedScan)
	}
	if !cat.savedScan.AllowsPrune() || !report.Complete {
		t.Error("a complete scanner snapshot should preserve prune authority in persistence and reporting")
	}
	if cat.savedAt != fixedNowMillis {
		t.Errorf("Save timestamp = %d, want injected clock %d", cat.savedAt, fixedNowMillis)
	}
}

func TestPickAndScanUsesPickerThenScans(t *testing.T) {
	cat := &fakeCatalog{added: 1, total: 1}
	svc := NewService(cat, fakeScanner{snapshot: domain.ScanSnapshot{
		FilesSeen:    1,
		Completeness: domain.ScanComplete,
	}}, fakePicker{folder: "/chosen"}, fakeLyrics{}, fixedClock{})

	report, err := svc.PickAndScan(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if report.Folder != "/chosen" {
		t.Errorf("scanned folder = %q, want the picked one", report.Folder)
	}
}

func TestPickAndScanCancelledIsNoOp(t *testing.T) {
	cat := &fakeCatalog{}
	svc := NewService(cat, fakeScanner{}, fakePicker{folder: ""}, fakeLyrics{}, fixedClock{}) // user cancelled

	report, err := svc.PickAndScan(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if report.Folder != "" {
		t.Errorf("cancel should yield a zero report, got %+v", report)
	}
	if cat.savedScan != nil {
		t.Error("cancel must not touch the catalog")
	}
}

func TestPartialScanPersistsObservedFilesWithoutPruneAuthority(t *testing.T) {
	cat := &fakeCatalog{added: 1, total: 5}
	scanner := fakeScanner{snapshot: domain.ScanSnapshot{
		Metadata:     []domain.TrackMetadata{{Path: "/m/readable.mp3"}},
		FilesSeen:    1,
		Completeness: domain.ScanPartial,
	}}
	svc := NewService(cat, scanner, fakePicker{}, fakeLyrics{}, fixedClock{})

	report, err := svc.ScanFolder(context.Background(), "/m")
	if err != nil {
		t.Fatal(err)
	}
	if report.Complete {
		t.Fatal("partial scan must be reported as incomplete")
	}
	if cat.savedScan == nil || cat.savedScan.AllowsPrune() {
		t.Fatalf("catalog scan = %+v, want persisted partial snapshot without prune authority", cat.savedScan)
	}
}

func TestCancelledScanDoesNotTouchCatalog(t *testing.T) {
	cat := &fakeCatalog{}
	svc := NewService(cat, fakeScanner{snapshot: domain.ScanSnapshot{
		Metadata:     []domain.TrackMetadata{{Path: "/m/a.mp3"}},
		Completeness: domain.ScanComplete,
	}}, fakePicker{}, fakeLyrics{}, fixedClock{})
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := svc.ScanFolder(ctx, "/m")
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("ScanFolderContext error = %v, want context.Canceled", err)
	}
	if cat.savedScan != nil {
		t.Fatal("cancelled scan must not touch the catalog")
	}
}

func TestScanWaitingForWriterCanBeCancelled(t *testing.T) {
	cat := &fakeCatalog{}
	scanner := blockingScanner{started: make(chan struct{}), release: make(chan struct{})}
	svc := NewService(cat, scanner, fakePicker{}, fakeLyrics{}, fixedClock{})
	firstDone := make(chan error, 1)
	go func() {
		_, err := svc.ScanFolder(context.Background(), "/first")
		firstDone <- err
	}()
	<-scanner.started

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err := svc.ScanFolder(ctx, "/second")
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("waiting ScanFolder error = %v, want context.Canceled", err)
	}

	close(scanner.release)
	if err := <-firstDone; err != nil {
		t.Fatalf("first scan error = %v", err)
	}
}

func TestHomeComposesCatalogReads(t *testing.T) {
	cat := &fakeCatalog{
		albums:  []domain.Album{{ID: "a"}},
		artists: []domain.Artist{{ID: "ar"}},
		recent:  []domain.Track{{ID: "t"}},
	}
	home, err := NewService(cat, fakeScanner{}, fakePicker{}, fakeLyrics{}, fixedClock{}).Home(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(home.Recent) != 1 || len(home.Albums) != 1 || len(home.Artists) != 1 {
		t.Errorf("home = %+v, want one of each", home)
	}
}

func TestDetailLookupsDistinguishMissingEntitiesFromEmptyDetails(t *testing.T) {
	svc := NewService(&fakeCatalog{}, fakeScanner{}, fakePicker{}, fakeLyrics{}, fixedClock{})

	album, err := svc.AlbumDetail(context.Background(), "missing")
	if err != nil || album != nil {
		t.Fatalf("AlbumDetail = (%+v, %v), want (nil, nil)", album, err)
	}
	artist, err := svc.ArtistDetail(context.Background(), "missing")
	if err != nil || artist != nil {
		t.Fatalf("ArtistDetail = (%+v, %v), want (nil, nil)", artist, err)
	}
}

func TestDetailLookupsReturnPresentEntitiesWithCompleteCollections(t *testing.T) {
	cat := &fakeCatalog{
		albums:  []domain.Album{{ID: "album"}},
		artists: []domain.Artist{{ID: "artist"}},
		recent:  []domain.Track{{ID: "track"}},
	}
	svc := NewService(cat, fakeScanner{}, fakePicker{}, fakeLyrics{}, fixedClock{})

	album, err := svc.AlbumDetail(context.Background(), "album")
	if err != nil || album == nil || album.Album.ID != "album" || len(album.Tracks) != 1 {
		t.Fatalf("AlbumDetail = (%+v, %v), want present detail", album, err)
	}
	artist, err := svc.ArtistDetail(context.Background(), "artist")
	if err != nil || artist == nil || artist.Artist.ID != "artist" || len(artist.Tracks) != 1 {
		t.Fatalf("ArtistDetail = (%+v, %v), want present detail", artist, err)
	}
}

func TestUnavailableWhenCatalogNil(t *testing.T) {
	svc := NewService(nil, nil, fakePicker{}, nil, fixedClock{}) // infra failed to open

	if _, err := svc.Home(context.Background()); err != ErrUnavailable {
		t.Errorf("Home err = %v, want ErrUnavailable", err)
	}
	if _, err := svc.ScanFolder(context.Background(), "/x"); err != ErrUnavailable {
		t.Errorf("ScanFolder err = %v, want ErrUnavailable", err)
	}
}

// A missing reader/picker is a degraded backend, not "this track has no lyrics"
// or an anonymous failure: both must project as unavailable at the wire.
func TestUnavailableWhenPortIsMissing(t *testing.T) {
	lyricless := NewService(&fakeCatalog{path: "/m/song.flac"}, fakeScanner{}, fakePicker{}, nil, fixedClock{})
	if _, err := lyricless.Lyric(context.Background(), "t1"); !errors.Is(err, ErrUnavailable) {
		t.Errorf("Lyric error = %v, want ErrUnavailable", err)
	}

	pickerless := NewService(&fakeCatalog{}, fakeScanner{}, nil, fakeLyrics{}, fixedClock{})
	if _, err := pickerless.PickFolder(context.Background()); !errors.Is(err, ErrUnavailable) {
		t.Errorf("PickFolder error = %v, want ErrUnavailable", err)
	}
	if _, err := pickerless.PickAndScan(context.Background()); !errors.Is(err, ErrUnavailable) {
		t.Errorf("PickAndScan error = %v, want ErrUnavailable", err)
	}
}

func TestScanUnavailableWhenRequiredDependencyIsMissing(t *testing.T) {
	tests := []struct {
		name    string
		scanner domain.Scanner
		clock   Clock
	}{
		{name: "scanner", clock: fixedClock{}},
		{name: "clock", scanner: fakeScanner{}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			svc := NewService(&fakeCatalog{}, test.scanner, fakePicker{}, fakeLyrics{}, test.clock)
			if _, err := svc.ScanFolder(context.Background(), "/x"); !errors.Is(err, ErrUnavailable) {
				t.Fatalf("ScanFolder error = %v, want ErrUnavailable", err)
			}
		})
	}
}

func TestLyricReadsSidecarForTrackPath(t *testing.T) {
	cat := &fakeCatalog{path: "/m/song.flac"}
	lyr := fakeLyrics{byPath: map[string]string{"/m/song.flac": "[00:01.00]hi"}}
	svc := NewService(cat, fakeScanner{}, fakePicker{}, lyr, fixedClock{})

	got, err := svc.Lyric(context.Background(), "t1")
	if err != nil {
		t.Fatal(err)
	}
	if got != "[00:01.00]hi" {
		t.Errorf("Lyric = %q, want the sidecar text resolved via TrackPath", got)
	}
}

func TestLyricEmptyWhenTrackHasNoPath(t *testing.T) {
	cat := &fakeCatalog{} // TrackPath returns ""
	svc := NewService(cat, fakeScanner{}, fakePicker{}, fakeLyrics{}, fixedClock{})

	got, err := svc.Lyric(context.Background(), "missing")
	if err != nil {
		t.Fatal(err)
	}
	if got != "" {
		t.Errorf("Lyric = %q, want empty for an unknown track", got)
	}
}

func TestLyricPropagatesCatalogFailure(t *testing.T) {
	cause := errors.New("catalog read failed")
	svc := NewService(&fakeCatalog{pathErr: cause}, fakeScanner{}, fakePicker{}, fakeLyrics{}, fixedClock{})

	got, err := svc.Lyric(context.Background(), "t1")
	if got != "" || !errors.Is(err, cause) {
		t.Fatalf("Lyric = (%q, %v), want empty text and catalog cause", got, err)
	}
}

func TestLyricPreservesCancellation(t *testing.T) {
	svc := NewService(&fakeCatalog{pathErr: context.Canceled}, fakeScanner{}, fakePicker{}, fakeLyrics{}, fixedClock{})

	_, err := svc.Lyric(context.Background(), "t1")
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("Lyric error = %v, want context.Canceled", err)
	}
}
