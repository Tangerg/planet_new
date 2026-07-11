package sqlite

import (
	"context"
	"database/sql"

	"github.com/Tangerg/planet_new/backend/domain"
)

// ── tracks ───────────────────────────────────────────────────────────────────

const trackCols = `t.id, t.title, t.album_id, al.name, t.artist_id, t.artist,
	t.track_no, t.disc_no, t.duration_ms, t.year, t.genre, al.cover_ext, t.added_at`

const trackFrom = ` FROM tracks t JOIN albums al ON al.id = t.album_id`

func scanTracks(rows *sql.Rows) (_ []domain.Track, err error) {
	defer closeRows(rows, &err)
	out := []domain.Track{}
	for rows.Next() {
		var (
			t          domain.Track
			id, alID   string
			arID       string
			durationMs int
			coverExt   string
		)
		if err := rows.Scan(&id, &t.Title, &alID, &t.Album, &arID, &t.Artist,
			&t.TrackNo, &t.DiscNo, &durationMs, &t.Year, &t.Genre, &coverExt, &t.AddedAt); err != nil {
			return nil, err
		}
		t.ID = domain.TrackID(id)
		t.AlbumID = domain.AlbumID(alID)
		t.ArtistID = domain.ArtistID(arID)
		t.Duration = domain.Duration(durationMs)
		if coverExt != "" {
			t.Cover = domain.Cover{Album: t.AlbumID}
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (c *Catalog) AllTracks(ctx context.Context) ([]domain.Track, error) {
	rows, err := c.db.QueryContext(ctx, `SELECT `+trackCols+trackFrom+
		` ORDER BY t.artist, al.name, t.disc_no, t.track_no, t.title`)
	if err != nil {
		return nil, err
	}
	return scanTracks(rows)
}

func (c *Catalog) RecentTracks(ctx context.Context, limit int) ([]domain.Track, error) {
	rows, err := c.db.QueryContext(ctx, `SELECT `+trackCols+trackFrom+
		` ORDER BY t.added_at DESC, t.title LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	return scanTracks(rows)
}

func (c *Catalog) TracksByAlbum(ctx context.Context, id domain.AlbumID) ([]domain.Track, error) {
	rows, err := c.db.QueryContext(ctx, `SELECT `+trackCols+trackFrom+
		` WHERE t.album_id = ? ORDER BY t.disc_no, t.track_no, t.title`, id.String())
	if err != nil {
		return nil, err
	}
	return scanTracks(rows)
}

func (c *Catalog) TracksByArtist(ctx context.Context, id domain.ArtistID) ([]domain.Track, error) {
	rows, err := c.db.QueryContext(ctx, `SELECT `+trackCols+trackFrom+
		` WHERE t.artist_id = ? ORDER BY al.year DESC, al.name, t.disc_no, t.track_no`, id.String())
	if err != nil {
		return nil, err
	}
	return scanTracks(rows)
}

func (c *Catalog) Tracks(ctx context.Context, ids []domain.TrackID) ([]domain.Track, error) {
	if len(ids) == 0 {
		return []domain.Track{}, nil
	}
	keys := make([]string, len(ids))
	for i, id := range ids {
		keys[i] = id.String()
	}
	rows, err := c.db.QueryContext(ctx, `SELECT `+trackCols+trackFrom+
		` WHERE t.id IN (`+placeholders(len(keys))+`)`, toArgs(keys)...)
	if err != nil {
		return nil, err
	}
	tracks, err := scanTracks(rows)
	if err != nil {
		return nil, err
	}
	// SQL IN does not preserve caller order; restore it.
	byID := make(map[domain.TrackID]domain.Track, len(tracks))
	for _, t := range tracks {
		byID[t.ID] = t
	}
	ordered := make([]domain.Track, 0, len(ids))
	for _, id := range ids {
		if t, ok := byID[id]; ok {
			ordered = append(ordered, t)
		}
	}
	return ordered, nil
}

// ── albums ───────────────────────────────────────────────────────────────────

const albumCols = `al.id, al.name, al.artist_id, al.artist, al.year, al.cover_ext, al.added_at,
	(SELECT COUNT(*) FROM tracks t WHERE t.album_id = al.id) AS track_count`

func scanAlbums(rows *sql.Rows) (_ []domain.Album, err error) {
	defer closeRows(rows, &err)
	out := []domain.Album{}
	for rows.Next() {
		var (
			a        domain.Album
			id, arID string
			coverExt string
		)
		if err := rows.Scan(&id, &a.Name, &arID, &a.Artist, &a.Year, &coverExt, &a.AddedAt, &a.TrackCount); err != nil {
			return nil, err
		}
		a.ID = domain.AlbumID(id)
		a.ArtistID = domain.ArtistID(arID)
		if coverExt != "" {
			a.Cover = domain.Cover{Album: a.ID}
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (c *Catalog) Albums(ctx context.Context) ([]domain.Album, error) {
	rows, err := c.db.QueryContext(ctx, `SELECT `+albumCols+` FROM albums al ORDER BY al.artist, al.year DESC, al.name`)
	if err != nil {
		return nil, err
	}
	return scanAlbums(rows)
}

// AlbumsByArtist lists an artist's albums, newest first (for artist detail).
func (c *Catalog) AlbumsByArtist(ctx context.Context, id domain.ArtistID) ([]domain.Album, error) {
	rows, err := c.db.QueryContext(ctx, `SELECT `+albumCols+` FROM albums al WHERE al.artist_id = ? ORDER BY al.year DESC, al.name`, id.String())
	if err != nil {
		return nil, err
	}
	return scanAlbums(rows)
}

func (c *Catalog) Album(ctx context.Context, id domain.AlbumID) (*domain.Album, error) {
	rows, err := c.db.QueryContext(ctx, `SELECT `+albumCols+` FROM albums al WHERE al.id = ?`, id.String())
	if err != nil {
		return nil, err
	}
	albums, err := scanAlbums(rows)
	if err != nil || len(albums) == 0 {
		return nil, err
	}
	return &albums[0], nil
}

// ── artists ──────────────────────────────────────────────────────────────────

const artistCols = `ar.id, ar.name,
	(SELECT COUNT(*) FROM albums al WHERE al.artist_id = ar.id) AS album_count,
	(SELECT COUNT(*) FROM tracks t  WHERE t.artist_id  = ar.id) AS track_count,
	(SELECT al.id FROM albums al WHERE al.artist_id = ar.id AND al.cover_ext <> '' ORDER BY al.year DESC LIMIT 1) AS cover_album`

func scanArtists(rows *sql.Rows) (_ []domain.Artist, err error) {
	defer closeRows(rows, &err)
	out := []domain.Artist{}
	for rows.Next() {
		var (
			a          domain.Artist
			id         string
			coverAlbum sql.NullString
		)
		if err := rows.Scan(&id, &a.Name, &a.AlbumCount, &a.TrackCount, &coverAlbum); err != nil {
			return nil, err
		}
		a.ID = domain.ArtistID(id)
		if coverAlbum.Valid && coverAlbum.String != "" {
			a.Cover = domain.Cover{Album: domain.AlbumID(coverAlbum.String)}
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (c *Catalog) Artists(ctx context.Context) ([]domain.Artist, error) {
	rows, err := c.db.QueryContext(ctx, `SELECT `+artistCols+` FROM artists ar ORDER BY ar.name`)
	if err != nil {
		return nil, err
	}
	return scanArtists(rows)
}

func (c *Catalog) Artist(ctx context.Context, id domain.ArtistID) (*domain.Artist, error) {
	rows, err := c.db.QueryContext(ctx, `SELECT `+artistCols+` FROM artists ar WHERE ar.id = ?`, id.String())
	if err != nil {
		return nil, err
	}
	artists, err := scanArtists(rows)
	if err != nil || len(artists) == 0 {
		return nil, err
	}
	return &artists[0], nil
}

// ── search ───────────────────────────────────────────────────────────────────

func (c *Catalog) Search(ctx context.Context, query string, limit int) (domain.SearchResult, error) {
	res := domain.EmptySearchResult()
	like := "%" + escapeLike(query) + "%"

	trackRows, err := c.db.QueryContext(ctx, `SELECT `+trackCols+trackFrom+
		` WHERE t.title LIKE ? ESCAPE '\' ORDER BY t.title LIMIT ?`, like, limit)
	if err != nil {
		return res, err
	}
	if res.Tracks, err = scanTracks(trackRows); err != nil {
		return res, err
	}

	albumRows, err := c.db.QueryContext(ctx, `SELECT `+albumCols+` FROM albums al WHERE al.name LIKE ? ESCAPE '\' ORDER BY al.name LIMIT ?`, like, limit)
	if err != nil {
		return res, err
	}
	if res.Albums, err = scanAlbums(albumRows); err != nil {
		return res, err
	}

	artistRows, err := c.db.QueryContext(ctx, `SELECT `+artistCols+` FROM artists ar WHERE ar.name LIKE ? ESCAPE '\' ORDER BY ar.name LIMIT ?`, like, limit)
	if err != nil {
		return res, err
	}
	res.Artists, err = scanArtists(artistRows)
	return res, err
}

func closeRows(rows *sql.Rows, scanErr *error) {
	if closeErr := rows.Close(); *scanErr == nil && closeErr != nil {
		*scanErr = closeErr
	}
}
