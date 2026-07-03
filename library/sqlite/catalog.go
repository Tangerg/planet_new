// Package sqlite is the SQLite-backed implementation of domain.Catalog — the
// persistence adapter. It is pure infrastructure: it maps rows to domain
// entities and owns no transport concern (the application layer builds URLs).
// Uses the pure-Go driver so the Wails build stays CGo-free.
package sqlite

import (
	"database/sql"
	"fmt"

	"changeme/library/domain"

	_ "modernc.org/sqlite" // registers the pure-Go "sqlite" driver
)

// Catalog persists and queries the scanned library. It satisfies domain.Catalog
// (reads/writes) and the media package's Source (path/cover lookups).
type Catalog struct {
	db *sql.DB
}

var _ domain.Catalog = (*Catalog)(nil)

// Open connects to (creating + migrating) the library database at path.
func Open(path string) (*Catalog, error) {
	db, err := sql.Open("sqlite", "file:"+path+"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(0)")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1) // one writer; WAL still allows concurrent reads
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("migrate: %w", err)
	}
	return &Catalog{db: db}, nil
}

func (c *Catalog) Close() error {
	if c == nil || c.db == nil {
		return nil
	}
	return c.db.Close()
}

// Save writes one folder's scanned files in a single transaction, prunes files
// that vanished from that folder, then drops orphaned albums/artists.
func (c *Catalog) Save(folder string, metas []domain.TrackMetadata, at int64) (added, total int, err error) {
	tx, err := c.db.Begin()
	if err != nil {
		return 0, 0, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if _, err = tx.Exec(`INSERT INTO folders(path, added_at) VALUES(?, ?) ON CONFLICT(path) DO NOTHING`, folder, at); err != nil {
		return 0, 0, err
	}

	for _, m := range metas {
		artist, album, track := m.ToArtist(), m.ToAlbum(), m.ToTrack()
		if err = upsertArtist(tx, artist); err != nil {
			return 0, 0, err
		}
		if err = upsertAlbum(tx, album, m.CoverExt, at); err != nil {
			return 0, 0, err
		}
		var inserted bool
		if inserted, err = upsertTrack(tx, track, m.Path, at); err != nil {
			return 0, 0, err
		}
		if inserted {
			added++
		}
	}

	if err = pruneFolder(tx, folder, at); err != nil {
		return 0, 0, err
	}
	if err = tx.QueryRow(`SELECT COUNT(*) FROM tracks`).Scan(&total); err != nil {
		return 0, 0, err
	}
	err = tx.Commit()
	return added, total, err
}

func upsertArtist(tx *sql.Tx, a domain.Artist) error {
	_, err := tx.Exec(
		`INSERT INTO artists(id, name) VALUES(?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name`,
		a.ID.String(), a.Name,
	)
	return err
}

func upsertAlbum(tx *sql.Tx, a domain.Album, coverExt string, at int64) error {
	_, err := tx.Exec(
		`INSERT INTO albums(id, name, artist_id, artist, year, cover_ext, added_at)
		 VALUES(?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
		   name=excluded.name, artist_id=excluded.artist_id, artist=excluded.artist,
		   year=CASE WHEN excluded.year>0 THEN excluded.year ELSE albums.year END,
		   cover_ext=CASE WHEN excluded.cover_ext<>'' THEN excluded.cover_ext ELSE albums.cover_ext END`,
		a.ID.String(), a.Name, a.ArtistID.String(), a.Artist, a.Year, coverExt, at,
	)
	return err
}

func upsertTrack(tx *sql.Tx, t domain.Track, path string, at int64) (inserted bool, err error) {
	if _, err = tx.Exec(
		`INSERT INTO tracks(id, path, title, album_id, artist_id, artist, track_no, disc_no, duration_ms, year, genre, added_at, seen_at)
		 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
		   path=excluded.path, title=excluded.title, album_id=excluded.album_id,
		   artist_id=excluded.artist_id, artist=excluded.artist, track_no=excluded.track_no,
		   disc_no=excluded.disc_no, duration_ms=excluded.duration_ms, year=excluded.year,
		   genre=excluded.genre, seen_at=excluded.seen_at`,
		t.ID.String(), path, t.Title, t.AlbumID.String(), t.ArtistID.String(), t.Artist,
		t.TrackNo, t.DiscNo, t.Duration.Millis(), t.Year, t.Genre, at, at,
	); err != nil {
		return false, err
	}
	// A fresh insert stamps added_at=at; an update preserves the original
	// (first-seen) added_at. Distinguish by re-reading it.
	var addedAt int64
	if err = tx.QueryRow(`SELECT added_at FROM tracks WHERE id=?`, t.ID.String()).Scan(&addedAt); err != nil {
		return false, err
	}
	return addedAt == at, nil
}

func pruneFolder(tx *sql.Tx, folder string, at int64) error {
	if _, err := tx.Exec(`DELETE FROM tracks WHERE path LIKE ? ESCAPE '\' AND seen_at < ?`, likePrefix(folder), at); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM albums WHERE id NOT IN (SELECT DISTINCT album_id FROM tracks)`); err != nil {
		return err
	}
	_, err := tx.Exec(`DELETE FROM artists WHERE id NOT IN (SELECT DISTINCT artist_id FROM tracks)`)
	return err
}

func (c *Catalog) Count() (int, error) {
	var n int
	err := c.db.QueryRow(`SELECT COUNT(*) FROM tracks`).Scan(&n)
	return n, err
}

// TrackPath / AlbumCoverExt back the media package's HTTP endpoints (the media
// Source interface).
func (c *Catalog) TrackPath(id domain.TrackID) (string, error) {
	var path string
	err := c.db.QueryRow(`SELECT path FROM tracks WHERE id = ?`, id.String()).Scan(&path)
	return path, err
}

func (c *Catalog) AlbumCoverExt(id domain.AlbumID) (string, error) {
	var ext string
	err := c.db.QueryRow(`SELECT cover_ext FROM albums WHERE id = ?`, id.String()).Scan(&ext)
	return ext, err
}
