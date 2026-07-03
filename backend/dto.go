package backend

import (
	"net/url"
	"strings"

	"changeme/backend/domain"
)

// Wire DTOs — the shape the frontend consumes (Wails generates matching
// TypeScript). Kept flat + provider-neutral; the frontend mapper translates them
// into its domain models. Media/cover URLs are built here, at the transport
// seam, from the loopback server's base — the repository stays URL-free.

type Track struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	AlbumID     string `json:"albumId"`
	Album       string `json:"album"`
	ArtistID    string `json:"artistId"`
	Artist      string `json:"artist"`
	TrackNumber int    `json:"trackNumber"`
	DiscNumber  int    `json:"discNumber"`
	DurationMs  int    `json:"durationMs"`
	Year        int    `json:"year"`
	Genre       string `json:"genre"`
	PlayURL     string `json:"playUrl"`
	CoverURL    string `json:"coverUrl"`
	AddedAt     int64  `json:"addedAt"`
}

type Album struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	ArtistID   string `json:"artistId"`
	Artist     string `json:"artist"`
	Year       int    `json:"year"`
	TrackCount int    `json:"trackCount"`
	CoverURL   string `json:"coverUrl"`
	AddedAt    int64  `json:"addedAt"`
}

type Artist struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	AlbumCount int    `json:"albumCount"`
	TrackCount int    `json:"trackCount"`
	CoverURL   string `json:"coverUrl"`
}

type AlbumDetail struct {
	Album  Album   `json:"album"`
	Tracks []Track `json:"tracks"`
}

type ArtistDetail struct {
	Artist Artist  `json:"artist"`
	Albums []Album `json:"albums"`
	Tracks []Track `json:"tracks"`
}

type SearchResult struct {
	Tracks  []Track  `json:"tracks"`
	Albums  []Album  `json:"albums"`
	Artists []Artist `json:"artists"`
}

type Home struct {
	RecentTracks []Track  `json:"recentTracks"`
	Albums       []Album  `json:"albums"`
	Artists      []Artist `json:"artists"`
}

type ScanResult struct {
	Folder     string `json:"folder"`
	Scanned    int    `json:"scanned"`
	Added      int    `json:"added"`
	Total      int    `json:"total"`
	DurationMs int64  `json:"durationMs"`
}

// mediaURLs builds absolute loopback URLs from ids — the one place URL format
// lives. Owned by the app layer, not the repository.
type mediaURLs struct{ base string }

func (u mediaURLs) media(id domain.TrackID) string { return u.base + "/media/" + id.String() }

// stream maps a playback URL to a loopback, CORS-clean URL the webview can feed
// to Web Audio without tainting: our own /media (local files) is already
// loopback and returned unchanged; a remote CDN URL is wrapped in the /stream
// byte-proxy. Idempotent, so routing every play URL through it is safe.
func (u mediaURLs) stream(raw string) string {
	if raw == "" || strings.HasPrefix(raw, u.base) {
		return raw
	}
	return u.base + "/stream?url=" + url.QueryEscape(raw)
}

func (u mediaURLs) cover(c domain.Cover) string {
	if !c.Present() {
		return ""
	}
	return u.base + "/cover/" + c.Album.String()
}

func (u mediaURLs) track(t domain.Track) Track {
	return Track{
		ID:          t.ID.String(),
		Title:       t.Title,
		AlbumID:     t.AlbumID.String(),
		Album:       t.Album,
		ArtistID:    t.ArtistID.String(),
		Artist:      t.Artist,
		TrackNumber: t.TrackNo,
		DiscNumber:  t.DiscNo,
		DurationMs:  t.Duration.Millis(),
		Year:        t.Year,
		Genre:       t.Genre,
		PlayURL:     u.media(t.ID),
		CoverURL:    u.cover(t.Cover),
		AddedAt:     t.AddedAt,
	}
}

func (u mediaURLs) album(a domain.Album) Album {
	return Album{
		ID:         a.ID.String(),
		Name:       a.Name,
		ArtistID:   a.ArtistID.String(),
		Artist:     a.Artist,
		Year:       a.Year,
		TrackCount: a.TrackCount,
		CoverURL:   u.cover(a.Cover),
		AddedAt:    a.AddedAt,
	}
}

func (u mediaURLs) artist(a domain.Artist) Artist {
	return Artist{
		ID:         a.ID.String(),
		Name:       a.Name,
		AlbumCount: a.AlbumCount,
		TrackCount: a.TrackCount,
		CoverURL:   u.cover(a.Cover),
	}
}

func (u mediaURLs) tracks(ts []domain.Track) []Track {
	out := make([]Track, 0, len(ts))
	for _, t := range ts {
		out = append(out, u.track(t))
	}
	return out
}

func (u mediaURLs) albums(as []domain.Album) []Album {
	out := make([]Album, 0, len(as))
	for _, a := range as {
		out = append(out, u.album(a))
	}
	return out
}

func (u mediaURLs) artists(as []domain.Artist) []Artist {
	out := make([]Artist, 0, len(as))
	for _, a := range as {
		out = append(out, u.artist(a))
	}
	return out
}
