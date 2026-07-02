package library

import (
	"database/sql"
	"fmt"
	"strings"

	_ "modernc.org/sqlite" // pure-Go driver, registers "sqlite" (CGo-free build)
)

// store is the SQLite-backed catalog. It assembles the wire DTOs directly —
// including the absolute loopback URLs — so URL format lives in exactly one place
// (buildTrack / buildAlbum) rather than being reconstructed by each caller.
type store struct {
	db      *sql.DB
	baseURL string // media server origin, e.g. http://127.0.0.1:53219
}

// parsedTrack is one scanned file, before it becomes rows. CoverExt is the image
// extension of the album cover on disk ("" when the album has none), so the
// albums row can record cover presence.
type parsedTrack struct {
	Path        string
	Title       string
	Album       string
	AlbumArtist string
	Artist      string
	TrackNo     int
	DiscNo      int
	Year        int
	Genre       string
	DurationMs  int
	CoverExt    string
}

const schema = `
CREATE TABLE IF NOT EXISTS artists (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS albums (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  artist    TEXT NOT NULL,
  year      INTEGER NOT NULL DEFAULT 0,
  cover_ext TEXT NOT NULL DEFAULT '',
  added_at  INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tracks (
  id          TEXT PRIMARY KEY,
  path        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  album_id    TEXT NOT NULL,
  artist_id   TEXT NOT NULL,
  artist      TEXT NOT NULL,
  track_no    INTEGER NOT NULL DEFAULT 0,
  disc_no     INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  year        INTEGER NOT NULL DEFAULT 0,
  genre       TEXT NOT NULL DEFAULT '',
  added_at    INTEGER NOT NULL DEFAULT 0,
  seen_at     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tracks_album  ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
CREATE TABLE IF NOT EXISTS folders (
  path     TEXT PRIMARY KEY,
  added_at INTEGER NOT NULL DEFAULT 0
);
`

func openStore(path, baseURL string) (*store, error) {
	db, err := sql.Open("sqlite", "file:"+path+"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(0)")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1) // one writer; SQLite serializes anyway and WAL allows concurrent reads
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("migrate: %w", err)
	}
	return &store{db: db, baseURL: strings.TrimRight(baseURL, "/")}, nil
}

func (s *store) close() error {
	if s == nil || s.db == nil {
		return nil
	}
	return s.db.Close()
}

// ── writes ─────────────────────────────────────────────────────────────────

// scanUpsert writes the scanned files under `folder` in one transaction, prunes
// rows for files that vanished from that folder since the last scan, then drops
// orphaned albums/artists. Returns (added this scan, total tracks afterwards).
func (s *store) scanUpsert(folder string, files []parsedTrack, epoch int64) (added, total int, err error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, 0, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if _, err = tx.Exec(
		`INSERT INTO folders(path, added_at) VALUES(?, ?) ON CONFLICT(path) DO NOTHING`,
		folder, epoch,
	); err != nil {
		return 0, 0, err
	}

	for _, f := range files {
		artistName := firstNonEmpty(f.AlbumArtist, f.Artist, "Unknown Artist")
		albumName := firstNonEmpty(f.Album, "Unknown Album")
		aid := artistID(artistName)
		alid := albumID(artistName, albumName)
		tid := trackID(f.Path)

		if _, err = tx.Exec(
			`INSERT INTO artists(id, name) VALUES(?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name`,
			aid, artistName,
		); err != nil {
			return 0, 0, err
		}
		if _, err = tx.Exec(
			`INSERT INTO albums(id, name, artist_id, artist, year, cover_ext, added_at)
			 VALUES(?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(id) DO UPDATE SET
			   name=excluded.name, artist_id=excluded.artist_id, artist=excluded.artist,
			   year=CASE WHEN excluded.year>0 THEN excluded.year ELSE albums.year END,
			   cover_ext=CASE WHEN excluded.cover_ext<>'' THEN excluded.cover_ext ELSE albums.cover_ext END`,
			alid, albumName, aid, artistName, f.Year, f.CoverExt, epoch,
		); err != nil {
			return 0, 0, err
		}

		var inserted bool
		if inserted, err = upsertTrack(tx, tid, f, aid, alid, epoch); err != nil {
			return 0, 0, err
		}
		if inserted {
			added++
		}
	}

	// Prune files that disappeared from this folder, then orphaned parents.
	if _, err = tx.Exec(
		`DELETE FROM tracks WHERE path LIKE ? ESCAPE '\' AND seen_at < ?`,
		likePrefix(folder), epoch,
	); err != nil {
		return 0, 0, err
	}
	if _, err = tx.Exec(`DELETE FROM albums WHERE id NOT IN (SELECT DISTINCT album_id FROM tracks)`); err != nil {
		return 0, 0, err
	}
	if _, err = tx.Exec(`DELETE FROM artists WHERE id NOT IN (SELECT DISTINCT artist_id FROM tracks)`); err != nil {
		return 0, 0, err
	}

	if err = tx.QueryRow(`SELECT COUNT(*) FROM tracks`).Scan(&total); err != nil {
		return 0, 0, err
	}
	err = tx.Commit()
	return added, total, err
}

func upsertTrack(tx *sql.Tx, tid string, f parsedTrack, aid, alid string, epoch int64) (inserted bool, err error) {
	res, err := tx.Exec(
		`INSERT INTO tracks(id, path, title, album_id, artist_id, artist, track_no, disc_no, duration_ms, year, genre, added_at, seen_at)
		 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
		   path=excluded.path, title=excluded.title, album_id=excluded.album_id,
		   artist_id=excluded.artist_id, artist=excluded.artist, track_no=excluded.track_no,
		   disc_no=excluded.disc_no, duration_ms=excluded.duration_ms, year=excluded.year,
		   genre=excluded.genre, seen_at=excluded.seen_at`,
		tid, f.Path, firstNonEmpty(f.Title, baseName(f.Path)), alid, aid,
		firstNonEmpty(f.Artist, f.AlbumArtist, "Unknown Artist"),
		f.TrackNo, f.DiscNo, f.DurationMs, f.Year, f.Genre, epoch, epoch,
	)
	if err != nil {
		return false, err
	}
	// A fresh insert affects the row with added_at==epoch; an update keeps the
	// original added_at. Distinguish by re-reading added_at.
	var addedAt int64
	if err = tx.QueryRow(`SELECT added_at FROM tracks WHERE id=?`, tid).Scan(&addedAt); err != nil {
		return false, err
	}
	_ = res
	return addedAt == epoch, nil
}

func (s *store) countTracks() (int, error) {
	var n int
	err := s.db.QueryRow(`SELECT COUNT(*) FROM tracks`).Scan(&n)
	return n, err
}

// ── reads ────────────────────────────────────────────────────────────────────

const trackCols = `t.id, t.title, t.album_id, al.name, t.artist_id, t.artist,
	t.track_no, t.disc_no, t.duration_ms, t.year, t.genre, al.cover_ext, t.added_at`

const trackFrom = ` FROM tracks t JOIN albums al ON al.id = t.album_id`

func (s *store) scanTracks(rows *sql.Rows) ([]Track, error) {
	defer rows.Close()
	out := []Track{}
	for rows.Next() {
		var t Track
		var coverExt string
		if err := rows.Scan(&t.ID, &t.Title, &t.AlbumID, &t.Album, &t.ArtistID, &t.Artist,
			&t.TrackNumber, &t.DiscNumber, &t.DurationMs, &t.Year, &t.Genre, &coverExt, &t.AddedAt); err != nil {
			return nil, err
		}
		s.buildTrack(&t, coverExt)
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *store) buildTrack(t *Track, coverExt string) {
	t.PlayURL = s.baseURL + "/media/" + t.ID
	if coverExt != "" {
		t.CoverURL = s.baseURL + "/cover/" + t.AlbumID
	}
}

func (s *store) buildAlbum(a *Album, coverExt string) {
	if coverExt != "" {
		a.CoverURL = s.baseURL + "/cover/" + a.ID
	}
}

func (s *store) allTracks() ([]Track, error) {
	rows, err := s.db.Query(`SELECT ` + trackCols + trackFrom +
		` ORDER BY t.artist, al.name, t.disc_no, t.track_no, t.title`)
	if err != nil {
		return nil, err
	}
	return s.scanTracks(rows)
}

func (s *store) recentTracks(limit int) ([]Track, error) {
	rows, err := s.db.Query(`SELECT `+trackCols+trackFrom+
		` ORDER BY t.added_at DESC, t.title LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	return s.scanTracks(rows)
}

func (s *store) tracksByIDs(ids []string) ([]Track, error) {
	if len(ids) == 0 {
		return []Track{}, nil
	}
	rows, err := s.db.Query(`SELECT `+trackCols+trackFrom+
		` WHERE t.id IN (`+placeholders(len(ids))+`)`, toArgs(ids)...)
	if err != nil {
		return nil, err
	}
	tracks, err := s.scanTracks(rows)
	if err != nil {
		return nil, err
	}
	// Preserve caller order (SQL IN does not guarantee it).
	byID := make(map[string]Track, len(tracks))
	for _, t := range tracks {
		byID[t.ID] = t
	}
	ordered := make([]Track, 0, len(ids))
	for _, id := range ids {
		if t, ok := byID[id]; ok {
			ordered = append(ordered, t)
		}
	}
	return ordered, nil
}

func (s *store) tracksByAlbum(albumID string) ([]Track, error) {
	rows, err := s.db.Query(`SELECT `+trackCols+trackFrom+
		` WHERE t.album_id = ? ORDER BY t.disc_no, t.track_no, t.title`, albumID)
	if err != nil {
		return nil, err
	}
	return s.scanTracks(rows)
}

func (s *store) tracksByArtist(artistID string) ([]Track, error) {
	rows, err := s.db.Query(`SELECT `+trackCols+trackFrom+
		` WHERE t.artist_id = ? ORDER BY al.year DESC, al.name, t.disc_no, t.track_no`, artistID)
	if err != nil {
		return nil, err
	}
	return s.scanTracks(rows)
}

const albumCols = `al.id, al.name, al.artist_id, al.artist, al.year, al.cover_ext, al.added_at,
	(SELECT COUNT(*) FROM tracks t WHERE t.album_id = al.id) AS track_count`

func (s *store) scanAlbums(rows *sql.Rows) ([]Album, error) {
	defer rows.Close()
	out := []Album{}
	for rows.Next() {
		var a Album
		var coverExt string
		if err := rows.Scan(&a.ID, &a.Name, &a.ArtistID, &a.Artist, &a.Year, &coverExt, &a.AddedAt, &a.TrackCount); err != nil {
			return nil, err
		}
		s.buildAlbum(&a, coverExt)
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *store) listAlbums() ([]Album, error) {
	rows, err := s.db.Query(`SELECT ` + albumCols + ` FROM albums al ORDER BY al.artist, al.year DESC, al.name`)
	if err != nil {
		return nil, err
	}
	return s.scanAlbums(rows)
}

func (s *store) albumsByArtist(artistID string) ([]Album, error) {
	rows, err := s.db.Query(`SELECT `+albumCols+` FROM albums al WHERE al.artist_id = ? ORDER BY al.year DESC, al.name`, artistID)
	if err != nil {
		return nil, err
	}
	return s.scanAlbums(rows)
}

func (s *store) albumByID(id string) (*Album, error) {
	rows, err := s.db.Query(`SELECT `+albumCols+` FROM albums al WHERE al.id = ?`, id)
	if err != nil {
		return nil, err
	}
	albums, err := s.scanAlbums(rows)
	if err != nil {
		return nil, err
	}
	if len(albums) == 0 {
		return nil, nil
	}
	return &albums[0], nil
}

const artistCols = `ar.id, ar.name,
	(SELECT COUNT(*) FROM albums al WHERE al.artist_id = ar.id) AS album_count,
	(SELECT COUNT(*) FROM tracks t  WHERE t.artist_id  = ar.id) AS track_count,
	(SELECT al.id FROM albums al WHERE al.artist_id = ar.id AND al.cover_ext <> '' ORDER BY al.year DESC LIMIT 1) AS cover_album`

func (s *store) scanArtists(rows *sql.Rows) ([]Artist, error) {
	defer rows.Close()
	out := []Artist{}
	for rows.Next() {
		var a Artist
		var coverAlbum sql.NullString
		if err := rows.Scan(&a.ID, &a.Name, &a.AlbumCount, &a.TrackCount, &coverAlbum); err != nil {
			return nil, err
		}
		if coverAlbum.Valid && coverAlbum.String != "" {
			a.CoverURL = s.baseURL + "/cover/" + coverAlbum.String
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *store) listArtists() ([]Artist, error) {
	rows, err := s.db.Query(`SELECT ` + artistCols + ` FROM artists ar ORDER BY ar.name`)
	if err != nil {
		return nil, err
	}
	return s.scanArtists(rows)
}

func (s *store) artistByID(id string) (*Artist, error) {
	rows, err := s.db.Query(`SELECT `+artistCols+` FROM artists ar WHERE ar.id = ?`, id)
	if err != nil {
		return nil, err
	}
	artists, err := s.scanArtists(rows)
	if err != nil {
		return nil, err
	}
	if len(artists) == 0 {
		return nil, nil
	}
	return &artists[0], nil
}

func (s *store) search(q string, limit int) (SearchResult, error) {
	res := SearchResult{Tracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
	like := "%" + escapeLike(q) + "%"

	trackRows, err := s.db.Query(`SELECT `+trackCols+trackFrom+
		` WHERE t.title LIKE ? ESCAPE '\' ORDER BY t.title LIMIT ?`, like, limit)
	if err != nil {
		return res, err
	}
	if res.Tracks, err = s.scanTracks(trackRows); err != nil {
		return res, err
	}

	albumRows, err := s.db.Query(`SELECT `+albumCols+` FROM albums al WHERE al.name LIKE ? ESCAPE '\' ORDER BY al.name LIMIT ?`, like, limit)
	if err != nil {
		return res, err
	}
	if res.Albums, err = s.scanAlbums(albumRows); err != nil {
		return res, err
	}

	artistRows, err := s.db.Query(`SELECT `+artistCols+` FROM artists ar WHERE ar.name LIKE ? ESCAPE '\' ORDER BY ar.name LIMIT ?`, like, limit)
	if err != nil {
		return res, err
	}
	if res.Artists, err = s.scanArtists(artistRows); err != nil {
		return res, err
	}
	return res, nil
}

// trackPath / albumCoverExt back the media + cover HTTP endpoints.
func (s *store) trackPath(id string) (string, error) {
	var path string
	err := s.db.QueryRow(`SELECT path FROM tracks WHERE id = ?`, id).Scan(&path)
	return path, err
}

func (s *store) albumCoverExt(id string) (string, error) {
	var ext string
	err := s.db.QueryRow(`SELECT cover_ext FROM albums WHERE id = ?`, id).Scan(&ext)
	return ext, err
}
