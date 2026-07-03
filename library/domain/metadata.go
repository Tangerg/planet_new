package domain

// TrackMetadata is the raw tag data a scanner reads from one audio file, before
// domain normalization. It owns the rules that turn loose, often-missing tags
// into stable identities and display strings — "how do vague tags become a
// track/album/artist" is domain knowledge, kept here instead of in scattered
// helpers at the call sites. The scanner produces these; the repository saves
// the entities they derive.
type TrackMetadata struct {
	Path        string
	Title       string
	Album       string
	AlbumArtist string
	Artist      string
	TrackNo     int
	DiscNo      int
	Year        int
	Genre       string
	Duration    Duration
	CoverExt    string // album cover image extension on disk ("" = none)
}

// ToTrack derives the normalized track entity.
func (m TrackMetadata) ToTrack() Track {
	return Track{
		ID:       NewTrackID(m.Path),
		Title:    m.title(),
		AlbumID:  m.albumID(),
		Album:    m.albumName(),
		Cover:    m.cover(),
		ArtistID: m.artistID(),
		Artist:   m.displayArtist(),
		TrackNo:  m.TrackNo,
		DiscNo:   m.DiscNo,
		Duration: m.Duration,
		Year:     m.Year,
		Genre:    m.Genre,
	}
}

// ToAlbum derives the owning album entity (its artist is the album-artist).
func (m TrackMetadata) ToAlbum() Album {
	return Album{
		ID:       m.albumID(),
		Name:     m.albumName(),
		ArtistID: m.artistID(),
		Artist:   m.albumArtist(),
		Year:     m.Year,
		Cover:    m.cover(),
	}
}

// ToArtist derives the owning artist entity (grouped by album-artist).
func (m TrackMetadata) ToArtist() Artist {
	return Artist{ID: m.artistID(), Name: m.albumArtist()}
}

// Normalization rules — the single source of truth for identity + display.
func (m TrackMetadata) albumID() AlbumID   { return NewAlbumID(m.albumArtist(), m.albumName()) }
func (m TrackMetadata) artistID() ArtistID { return NewArtistID(m.albumArtist()) }

// albumArtist owns compilations/features: the album-artist tag wins, else the
// track artist, else a stable "Unknown Artist" bucket.
func (m TrackMetadata) albumArtist() string {
	return firstNonEmpty(m.AlbumArtist, m.Artist, "Unknown Artist")
}
func (m TrackMetadata) albumName() string { return firstNonEmpty(m.Album, "Unknown Album") }
func (m TrackMetadata) title() string     { return firstNonEmpty(m.Title, baseName(m.Path)) }

// displayArtist is the performing credit shown on the track row (may carry a
// "feat." the album-artist doesn't).
func (m TrackMetadata) displayArtist() string {
	return firstNonEmpty(m.Artist, m.AlbumArtist, "Unknown Artist")
}

func (m TrackMetadata) cover() Cover {
	if m.CoverExt != "" {
		return Cover{Album: m.albumID()}
	}
	return Cover{}
}
