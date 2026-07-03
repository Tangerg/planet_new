package sqlite

import (
	"path/filepath"
	"testing"

	"changeme/library/domain"
)

func newTestCatalog(t *testing.T) *Catalog {
	t.Helper()
	c, err := Open(filepath.Join(t.TempDir(), "test.db"))
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

func TestSaveGroupsEntitiesAndCovers(t *testing.T) {
	c := newTestCatalog(t)
	added, total, err := c.Save("/music", sampleMetas, 100)
	if err != nil {
		t.Fatal(err)
	}
	if added != 3 || total != 3 {
		t.Fatalf("added=%d total=%d, want 3/3", added, total)
	}

	if albums, _ := c.Albums(); len(albums) != 2 {
		t.Fatalf("albums=%d, want 2", len(albums))
	}
	if artists, _ := c.Artists(); len(artists) != 2 {
		t.Fatalf("artists=%d, want 2", len(artists))
	}

	// Album A: 2 tracks in track order, cover present (had jpg).
	a, err := c.Album(domain.NewAlbumID("Artist X", "Album A"))
	if err != nil || a == nil {
		t.Fatalf("Album A: %v", err)
	}
	if a.TrackCount != 2 || !a.Cover.Present() || a.Cover.Album != a.ID {
		t.Errorf("Album A = %+v, want 2 tracks + cover pointing to itself", a)
	}
	tracks, _ := c.TracksByAlbum(a.ID)
	if len(tracks) != 2 || tracks[0].Title != "Song A1" || tracks[1].Title != "Song A2" {
		t.Errorf("album tracks not in track order: %+v", tracks)
	}

	// Album B: no art, and the track shows its performing (feat) artist.
	b, _ := c.Album(domain.NewAlbumID("Artist Y", "Album B"))
	if b == nil || b.Cover.Present() {
		t.Errorf("Album B cover = %+v, want none", b)
	}
	bTracks, _ := c.TracksByAlbum(b.ID)
	if len(bTracks) != 1 || bTracks[0].Artist != "Artist Y feat Z" {
		t.Errorf("track display artist = %+v, want the performer", bTracks)
	}
}

func TestTracksByIDsPreservesOrder(t *testing.T) {
	c := newTestCatalog(t)
	if _, _, err := c.Save("/music", sampleMetas, 100); err != nil {
		t.Fatal(err)
	}
	id1 := domain.NewTrackID("/music/a/01.mp3")
	id2 := domain.NewTrackID("/music/b/01.flac")
	got, _ := c.Tracks([]domain.TrackID{id2, id1})
	if len(got) != 2 || got[0].ID != id2 || got[1].ID != id1 {
		t.Errorf("Tracks did not preserve caller order: %+v", got)
	}
}

func TestSearchMatchesEachDimension(t *testing.T) {
	c := newTestCatalog(t)
	if _, _, err := c.Save("/music", sampleMetas, 100); err != nil {
		t.Fatal(err)
	}
	if r, _ := c.Search("Song A", 50); len(r.Tracks) != 2 {
		t.Errorf("search tracks=%d, want 2", len(r.Tracks))
	}
	if r, _ := c.Search("Album B", 50); len(r.Albums) != 1 {
		t.Errorf("search albums=%d, want 1", len(r.Albums))
	}
	if r, _ := c.Search("Artist Y", 50); len(r.Artists) != 1 {
		t.Errorf("search artists=%d, want 1", len(r.Artists))
	}
}

func TestRescanPrunesVanishedFilesAndOrphans(t *testing.T) {
	c := newTestCatalog(t)
	if _, _, err := c.Save("/music", sampleMetas, 100); err != nil {
		t.Fatal(err)
	}
	kept := []domain.TrackMetadata{sampleMetas[0], sampleMetas[2]} // 02.mp3 gone
	added, total, err := c.Save("/music", kept, 200)
	if err != nil {
		t.Fatal(err)
	}
	if added != 0 || total != 2 {
		t.Fatalf("rescan added=%d total=%d, want 0/2", added, total)
	}
	a, _ := c.Album(domain.NewAlbumID("Artist X", "Album A"))
	if a == nil || a.TrackCount != 1 {
		t.Errorf("Album A track count after prune = %v, want 1", a)
	}
	// added_at is first-seen time, preserved across rescans (not bumped to 200).
	tracks, _ := c.TracksByAlbum(a.ID)
	if len(tracks) != 1 || tracks[0].AddedAt != 100 {
		t.Errorf("addedAt not preserved: %+v", tracks)
	}
}
