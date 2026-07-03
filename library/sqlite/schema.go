package sqlite

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
