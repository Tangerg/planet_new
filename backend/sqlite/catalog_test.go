package sqlite

import (
	"context"
	"errors"
	"path/filepath"
	"testing"

	"github.com/Tangerg/planet_new/backend/domain"
)

var testContext = context.Background()

func newTestCatalog(t *testing.T) *Catalog {
	t.Helper()
	c, err := Open(testContext, filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = c.Close() })
	return c
}

var sampleMetas = []domain.TrackMetadata{
	{Path: "/music/a/01.mp3", Title: "Song A1", Album: "Album A", AlbumArtist: "Artist X", Artist: "Artist X", TrackNo: 1, Duration: 1000, Year: 2020, CoverExt: "jpg"},
	{Path: "/music/a/02.mp3", Title: "Song A2", Album: "Album A", AlbumArtist: "Artist X", Artist: "Artist X", TrackNo: 2, Duration: 2000, Year: 2020, CoverExt: "jpg"},
	{Path: "/music/b/01.flac", Title: "Song B1", Album: "Album B", AlbumArtist: "Artist Y", Artist: "Artist Y feat Z", TrackNo: 1, Duration: 3000, Year: 2021},
}

func completeScan(metas []domain.TrackMetadata) domain.ScanSnapshot {
	return domain.ScanSnapshot{
		Metadata:     metas,
		FilesSeen:    len(metas),
		Completeness: domain.ScanComplete,
	}
}

func partialScan(metas []domain.TrackMetadata) domain.ScanSnapshot {
	return domain.ScanSnapshot{
		Metadata:     metas,
		FilesSeen:    len(metas),
		Completeness: domain.ScanPartial,
	}
}

func TestSaveGroupsEntitiesAndCovers(t *testing.T) {
	c := newTestCatalog(t)
	added, total, err := c.Save(testContext, "/music", completeScan(sampleMetas), 100)
	if err != nil {
		t.Fatal(err)
	}
	if added != 3 || total != 3 {
		t.Fatalf("added=%d total=%d, want 3/3", added, total)
	}

	if albums, _ := c.Albums(testContext); len(albums) != 2 {
		t.Fatalf("albums=%d, want 2", len(albums))
	}
	if artists, _ := c.Artists(testContext); len(artists) != 2 {
		t.Fatalf("artists=%d, want 2", len(artists))
	}

	// Album A: 2 tracks in track order, cover present (had jpg).
	a, err := c.Album(testContext, domain.NewAlbumID("Artist X", "Album A"))
	if err != nil || a == nil {
		t.Fatalf("Album A: %v", err)
	}
	if a.TrackCount != 2 || !a.Cover.Present() || a.Cover.Album != a.ID {
		t.Errorf("Album A = %+v, want 2 tracks + cover pointing to itself", a)
	}
	tracks, _ := c.TracksByAlbum(testContext, a.ID)
	if len(tracks) != 2 || tracks[0].Title != "Song A1" || tracks[1].Title != "Song A2" {
		t.Errorf("album tracks not in track order: %+v", tracks)
	}

	// Album B: no art, and the track shows its performing (feat) artist.
	b, _ := c.Album(testContext, domain.NewAlbumID("Artist Y", "Album B"))
	if b == nil || b.Cover.Present() {
		t.Errorf("Album B cover = %+v, want none", b)
	}
	bTracks, _ := c.TracksByAlbum(testContext, b.ID)
	if len(bTracks) != 1 || bTracks[0].Artist != "Artist Y feat Z" {
		t.Errorf("track display artist = %+v, want the performer", bTracks)
	}
}

func TestTracksByIDsPreservesOrder(t *testing.T) {
	c := newTestCatalog(t)
	if _, _, err := c.Save(testContext, "/music", completeScan(sampleMetas), 100); err != nil {
		t.Fatal(err)
	}
	id1 := domain.NewTrackID("/music/a/01.mp3")
	id2 := domain.NewTrackID("/music/b/01.flac")
	got, _ := c.Tracks(testContext, []domain.TrackID{id2, id1})
	if len(got) != 2 || got[0].ID != id2 || got[1].ID != id1 {
		t.Errorf("Tracks did not preserve caller order: %+v", got)
	}
}

func TestSearchMatchesEachDimension(t *testing.T) {
	c := newTestCatalog(t)
	if _, _, err := c.Save(testContext, "/music", completeScan(sampleMetas), 100); err != nil {
		t.Fatal(err)
	}
	if r, _ := c.Search(testContext, "Song A", 50); len(r.Tracks) != 2 {
		t.Errorf("search tracks=%d, want 2", len(r.Tracks))
	}
	if r, _ := c.Search(testContext, "Album B", 50); len(r.Albums) != 1 {
		t.Errorf("search albums=%d, want 1", len(r.Albums))
	}
	if r, _ := c.Search(testContext, "Artist Y", 50); len(r.Artists) != 1 {
		t.Errorf("search artists=%d, want 1", len(r.Artists))
	}
}

func TestRescanPrunesVanishedFilesAndOrphans(t *testing.T) {
	c := newTestCatalog(t)
	if _, _, err := c.Save(testContext, "/music", completeScan(sampleMetas), 100); err != nil {
		t.Fatal(err)
	}
	kept := []domain.TrackMetadata{sampleMetas[0], sampleMetas[2]} // 02.mp3 gone
	added, total, err := c.Save(testContext, "/music", completeScan(kept), 200)
	if err != nil {
		t.Fatal(err)
	}
	if added != 0 || total != 2 {
		t.Fatalf("rescan added=%d total=%d, want 0/2", added, total)
	}
	a, _ := c.Album(testContext, domain.NewAlbumID("Artist X", "Album A"))
	if a == nil || a.TrackCount != 1 {
		t.Errorf("Album A track count after prune = %v, want 1", a)
	}
	// added_at is first-seen time, preserved across rescans (not bumped to 200).
	tracks, _ := c.TracksByAlbum(testContext, a.ID)
	if len(tracks) != 1 || tracks[0].AddedAt != 100 {
		t.Errorf("addedAt not preserved: %+v", tracks)
	}
}

func TestPartialRescanNeverPrunesUnobservedFiles(t *testing.T) {
	c := newTestCatalog(t)
	if _, _, err := c.Save(testContext, "/music", completeScan(sampleMetas), 100); err != nil {
		t.Fatal(err)
	}

	// The scanner observed only one readable path; the other paths may still
	// exist behind an unreadable subtree, so their absence is not authoritative.
	added, total, err := c.Save(testContext, "/music", partialScan(sampleMetas[:1]), 200)
	if err != nil {
		t.Fatal(err)
	}
	if added != 0 || total != 3 {
		t.Fatalf("partial rescan added=%d total=%d, want 0/3 without pruning", added, total)
	}
	tracks, err := c.AllTracks(testContext)
	if err != nil {
		t.Fatal(err)
	}
	if len(tracks) != 3 {
		t.Fatalf("partial rescan retained %d tracks, want all 3", len(tracks))
	}
}

func TestCatalogOperationsHonorCancellation(t *testing.T) {
	c := newTestCatalog(t)
	if _, _, err := c.Save(testContext, "/music", completeScan(sampleMetas[:1]), 100); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	if _, _, err := c.Save(ctx, "/other", completeScan(sampleMetas[1:]), 200); !errors.Is(err, context.Canceled) {
		t.Fatalf("cancelled Save error = %v, want context.Canceled", err)
	}
	if _, err := c.AllTracks(ctx); !errors.Is(err, context.Canceled) {
		t.Fatalf("cancelled AllTracks error = %v, want context.Canceled", err)
	}
	count, err := c.Count(testContext)
	if err != nil || count != 1 {
		t.Fatalf("count after cancelled Save = %d, %v; want unchanged 1", count, err)
	}
}

func TestTrackPathTreatsMissingTrackAsEmptyResult(t *testing.T) {
	c := newTestCatalog(t)

	path, err := c.TrackPath(testContext, "missing")
	if err != nil || path != "" {
		t.Fatalf("TrackPath = (%q, %v), want empty path without error", path, err)
	}
}
