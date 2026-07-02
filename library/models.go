// Package library is the on-device music source: it scans folders for audio
// files, keeps their metadata in an embedded SQLite database, and streams the
// files to the frontend over a loopback HTTP server. It is bound to the Wails
// runtime so the React `LocalMusic` provider can reach it over the JS bridge.
//
// The DTOs below are the wire shape between Go and the frontend; Wails generates
// matching TypeScript into `frontend/wailsjs/go/library/models.ts`. They are kept
// flat and provider-neutral — the frontend mapper translates them into domain
// entities (Track / Album / Artist / Playlist), so nothing here leaks a storage
// or tag-format noun into the domain.
package library

// Track is one audio file. `playUrl` / `coverUrl` are absolute loopback URLs the
// `<audio>`/`<img>` elements can load directly (the media server owns the port).
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

// Album groups tracks by (album-artist, album-name).
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

// Artist groups albums/tracks by album-artist name.
type Artist struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	AlbumCount int    `json:"albumCount"`
	TrackCount int    `json:"trackCount"`
	CoverURL   string `json:"coverUrl"`
}

// AlbumDetail is an album plus its tracks (disc/track ordered).
type AlbumDetail struct {
	Album  Album   `json:"album"`
	Tracks []Track `json:"tracks"`
}

// ArtistDetail is an artist plus their albums and tracks.
type ArtistDetail struct {
	Artist Artist  `json:"artist"`
	Albums []Album `json:"albums"`
	Tracks []Track `json:"tracks"`
}

// SearchResult is the local match set across dimensions.
type SearchResult struct {
	Tracks  []Track  `json:"tracks"`
	Albums  []Album  `json:"albums"`
	Artists []Artist `json:"artists"`
}

// Home is the personalized/browse payload: newest tracks + album/artist shelves.
type Home struct {
	RecentTracks []Track  `json:"recentTracks"`
	Albums       []Album  `json:"albums"`
	Artists      []Artist `json:"artists"`
}

// ScanResult reports what a folder scan changed. `Added` counts newly-indexed
// files; `Total` is the library size afterwards.
type ScanResult struct {
	Folder     string `json:"folder"`
	Scanned    int    `json:"scanned"`
	Added      int    `json:"added"`
	Total      int    `json:"total"`
	DurationMs int64  `json:"durationMs"`
}
