package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

type migration struct {
	version int
	sql     string
}

const schemaV1 = `
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
);`

const schemaV2 = `
CREATE INDEX IF NOT EXISTS idx_tracks_album  ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
CREATE TABLE IF NOT EXISTS folders (
  path     TEXT PRIMARY KEY,
  added_at INTEGER NOT NULL DEFAULT 0
);`

var schemaMigrations = []migration{
	{version: 1, sql: schemaV1},
	{version: 2, sql: schemaV2},
}

const currentSchemaVersion = 2

// ErrSchemaTooNew prevents an older binary from opening a database whose
// schema was written by a newer application version.
var ErrSchemaTooNew = errors.New("database schema is newer than this application")

func migrateSchema(ctx context.Context, db *sql.DB) error {
	return applyMigrations(ctx, db, schemaMigrations, validateCurrentSchema)
}

func applyMigrations(
	ctx context.Context,
	db *sql.DB,
	migrations []migration,
	validate func(context.Context, *sql.Tx) error,
) (err error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer rollbackOnError(tx, &err)

	var version int
	if err = tx.QueryRowContext(ctx, `PRAGMA user_version`).Scan(&version); err != nil {
		return err
	}
	if version > currentSchemaVersion {
		return fmt.Errorf("%w: database=%d application=%d", ErrSchemaTooNew, version, currentSchemaVersion)
	}

	for _, migration := range migrations {
		if migration.version <= version {
			continue
		}
		if migration.version != version+1 {
			return fmt.Errorf("non-contiguous schema migration: have=%d next=%d", version, migration.version)
		}
		if _, err = tx.ExecContext(ctx, migration.sql); err != nil {
			return fmt.Errorf("apply schema migration %d: %w", migration.version, err)
		}
		if _, err = tx.ExecContext(ctx, fmt.Sprintf("PRAGMA user_version = %d", migration.version)); err != nil {
			return fmt.Errorf("record schema migration %d: %w", migration.version, err)
		}
		version = migration.version
	}
	if version != currentSchemaVersion {
		return fmt.Errorf("schema migration ended at %d, want %d", version, currentSchemaVersion)
	}
	if validate != nil {
		if err = validate(ctx, tx); err != nil {
			return fmt.Errorf("validate schema %d: %w", version, err)
		}
	}
	return tx.Commit()
}

func validateCurrentSchema(ctx context.Context, tx *sql.Tx) error {
	queries := []string{
		`SELECT id, name FROM artists LIMIT 0`,
		`SELECT id, name, artist_id, artist, year, cover_ext, added_at FROM albums LIMIT 0`,
		`SELECT id, path, title, album_id, artist_id, artist, track_no, disc_no, duration_ms, year, genre, added_at, seen_at FROM tracks LIMIT 0`,
		`SELECT path, added_at FROM folders LIMIT 0`,
	}
	for _, query := range queries {
		rows, err := tx.QueryContext(ctx, query)
		if err != nil {
			return err
		}
		if err := rows.Close(); err != nil {
			return err
		}
	}
	return nil
}
