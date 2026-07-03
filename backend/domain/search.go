package domain

// SearchResult is a local match set across dimensions — the shape a Catalog
// search returns. Slices are never nil so the wire layer emits `[]`.
type SearchResult struct {
	Tracks  []Track
	Albums  []Album
	Artists []Artist
}

// EmptySearchResult is the zero-match result (blank query / no hits).
func EmptySearchResult() SearchResult {
	return SearchResult{Tracks: []Track{}, Albums: []Album{}, Artists: []Artist{}}
}
