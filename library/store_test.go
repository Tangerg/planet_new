package library

import (
	"path/filepath"
	"testing"
)

func newTestStore(t *testing.T) *store {
	t.Helper()
	st, err := openStore(filepath.Join(t.TempDir(), "test.db"), "http://127.0.0.1:9999/")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = st.close() })
	return st
}

var sampleFiles = []parsedTrack{
	{Path: "/music/a/01.mp3", Title: "Song A1", Album: "Album A", AlbumArtist: "Artist X", Artist: "Artist X", TrackNo: 1, DurationMs: 1000, Year: 2020, CoverExt: "jpg"},
	{Path: "/music/a/02.mp3", Title: "Song A2", Album: "Album A", AlbumArtist: "Artist X", Artist: "Artist X", TrackNo: 2, DurationMs: 2000, Year: 2020, CoverExt: "jpg"},
	{Path: "/music/b/01.flac", Title: "Song B1", Album: "Album B", AlbumArtist: "Artist Y", Artist: "Artist Y feat Z", TrackNo: 1, DurationMs: 3000, Year: 2021},
}

func TestScanUpsertGroupsAndBuildsURLs(t *testing.T) {
	st := newTestStore(t)
	added, total, err := st.scanUpsert("/music", sampleFiles, 100)
	if err != nil {
		t.Fatal(err)
	}
	if added != 3 || total != 3 {
		t.Fatalf("added=%d total=%d, want 3/3", added, total)
	}

	albums, _ := st.listAlbums()
	if len(albums) != 2 {
		t.Fatalf("albums=%d, want 2", len(albums))
	}
	artists, _ := st.listArtists()
	if len(artists) != 2 {
		t.Fatalf("artists=%d, want 2", len(artists))
	}

	// Album A: 2 tracks in track-number order; its cover URL is built (has jpg).
	a, err := st.albumByID(albumID("Artist X", "Album A"))
	if err != nil || a == nil {
		t.Fatalf("albumByID A: %v", err)
	}
	if a.TrackCount != 2 {
		t.Errorf("Album A trackCount=%d, want 2", a.TrackCount)
	}
	if a.CoverURL != "http://127.0.0.1:9999/cover/"+a.ID {
		t.Errorf("Album A coverURL=%q, want built loopback URL", a.CoverURL)
	}
	tracks, _ := st.tracksByAlbum(a.ID)
	if len(tracks) != 2 || tracks[0].Title != "Song A1" || tracks[1].Title != "Song A2" {
		t.Errorf("album tracks not in track-number order: %+v", tracks)
	}
	if tracks[0].PlayURL != "http://127.0.0.1:9999/media/"+tracks[0].ID {
		t.Errorf("track playURL=%q, want built loopback URL", tracks[0].PlayURL)
	}

	// Album B has no cover → empty coverURL.
	b, _ := st.albumByID(albumID("Artist Y", "Album B"))
	if b == nil || b.CoverURL != "" {
		t.Errorf("Album B coverURL=%q, want empty (no art)", b.CoverURL)
	}
	// Track B1 displays its own performing artist, not the album artist.
	bTracks, _ := st.tracksByAlbum(b.ID)
	if len(bTracks) != 1 || bTracks[0].Artist != "Artist Y feat Z" {
		t.Errorf("track display artist = %+v, want the performing artist", bTracks)
	}
}

func TestTracksByIDsPreservesOrder(t *testing.T) {
	st := newTestStore(t)
	if _, _, err := st.scanUpsert("/music", sampleFiles, 100); err != nil {
		t.Fatal(err)
	}
	id1 := trackID("/music/a/01.mp3")
	id2 := trackID("/music/b/01.flac")
	got, _ := st.tracksByIDs([]string{id2, id1})
	if len(got) != 2 || got[0].ID != id2 || got[1].ID != id1 {
		t.Errorf("tracksByIDs did not preserve caller order: %+v", got)
	}
}

func TestSearchMatchesEachDimension(t *testing.T) {
	st := newTestStore(t)
	if _, _, err := st.scanUpsert("/music", sampleFiles, 100); err != nil {
		t.Fatal(err)
	}
	res, err := st.search("Song A", 50)
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Tracks) != 2 {
		t.Errorf("search tracks=%d, want 2", len(res.Tracks))
	}
	if r, _ := st.search("Album B", 50); len(r.Albums) != 1 {
		t.Errorf("search albums=%d, want 1", len(r.Albums))
	}
	if r, _ := st.search("Artist Y", 50); len(r.Artists) != 1 {
		t.Errorf("search artists=%d, want 1", len(r.Artists))
	}
}

func TestRescanPrunesVanishedFilesAndOrphans(t *testing.T) {
	st := newTestStore(t)
	if _, _, err := st.scanUpsert("/music", sampleFiles, 100); err != nil {
		t.Fatal(err)
	}
	// Rescan with 02.mp3 gone (and Album B untouched, different folder subtree).
	kept := []parsedTrack{sampleFiles[0], sampleFiles[2]}
	added, total, err := st.scanUpsert("/music", kept, 200)
	if err != nil {
		t.Fatal(err)
	}
	if added != 0 {
		t.Errorf("added=%d on rescan of existing files, want 0", added)
	}
	if total != 2 {
		t.Errorf("total=%d after prune, want 2", total)
	}
	a, _ := st.albumByID(albumID("Artist X", "Album A"))
	if a == nil || a.TrackCount != 1 {
		t.Errorf("Album A trackCount after prune = %v, want 1", a)
	}
	// added_at is preserved across rescans (first-seen time), not bumped to 200.
	tracks, _ := st.tracksByAlbum(a.ID)
	if len(tracks) != 1 || tracks[0].AddedAt != 100 {
		t.Errorf("addedAt not preserved across rescan: %+v", tracks)
	}
}
