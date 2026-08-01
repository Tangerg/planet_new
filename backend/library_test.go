package backend

import (
	"strings"
	"testing"
	"time"

	"github.com/Tangerg/planet_new/backend/application"
	"github.com/Tangerg/planet_new/backend/domain"
)

func TestLibraryProjectsUnavailableAsStableWireError(t *testing.T) {
	service := application.NewService(nil, nil, nil, nil, wallClock{})
	library := newLibrary(service, mediaURLs{})

	_, err := library.Home()
	if err == nil {
		t.Fatal("Home unexpectedly succeeded with unavailable infrastructure")
	}
	want := `PLANET_ERROR:{"code":"unavailable","operation":"localLibrary.home"}`
	if err.Error() != want {
		t.Fatalf("Home wire error = %q, want %q", err, want)
	}
	if strings.Contains(err.Error(), "sqlite") {
		t.Fatal("Home wire error leaked infrastructure details")
	}
}

func TestLibraryRejectsMalformedEntityIDsAtTheWireBoundary(t *testing.T) {
	service := application.NewService(nil, nil, nil, nil, wallClock{})
	library := newLibrary(service, mediaURLs{})
	tests := []struct {
		name      string
		operation string
		call      func() error
	}{
		{name: "album", operation: "localLibrary.albumDetail", call: func() error {
			_, err := library.AlbumDetail("album")
			return err
		}},
		{name: "artist", operation: "localLibrary.artistDetail", call: func() error {
			_, err := library.ArtistDetail("artist")
			return err
		}},
		{name: "tracks", operation: "localLibrary.tracks", call: func() error {
			_, err := library.Tracks([]string{"0123456789abcdef", "broken"})
			return err
		}},
		{name: "lyric", operation: "localLibrary.lyric", call: func() error {
			_, err := library.Lyric("track")
			return err
		}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := test.call()
			want := `PLANET_ERROR:{"code":"invalidArgument","operation":"` + test.operation + `"}`
			if err == nil || err.Error() != want {
				t.Fatalf("wire validation error = %v, want %s", err, want)
			}
		})
	}
}

func TestScanResultProjectsExplicitOutcomeStatus(t *testing.T) {
	cases := []struct {
		name   string
		report application.ScanReport
		want   ScanStatus
	}{
		{name: "cancelled", report: application.ScanReport{}, want: ScanCancelled},
		{name: "partial", report: application.ScanReport{Folder: "/music"}, want: ScanPartial},
		{
			name:   "complete",
			report: application.ScanReport{Folder: "/music", Complete: true},
			want:   ScanComplete,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := scanResult(tc.report, time.Now())
			if result.Status != tc.want {
				t.Fatalf("scan status = %q, want %q", result.Status, tc.want)
			}
		})
	}
}

func TestDetailResultsProjectExplicitLookupStatus(t *testing.T) {
	urls := mediaURLs{base: "http://127.0.0.1:9999"}

	missingAlbum := albumDetailResult(nil, urls)
	if missingAlbum.Status != LookupNotFound || missingAlbum.Detail.Tracks == nil {
		t.Fatalf("missing album result = %+v, want notFound with a stable empty list", missingAlbum)
	}
	foundAlbum := albumDetailResult(&application.AlbumDetail{
		Album:  domain.Album{ID: "album"},
		Tracks: []domain.Track{{ID: "track"}},
	}, urls)
	if foundAlbum.Status != LookupFound || foundAlbum.Detail.Album.ID != "album" || len(foundAlbum.Detail.Tracks) != 1 {
		t.Fatalf("found album result = %+v, want found detail", foundAlbum)
	}

	missingArtist := artistDetailResult(nil, urls)
	if missingArtist.Status != LookupNotFound || missingArtist.Detail.Albums == nil || missingArtist.Detail.Tracks == nil {
		t.Fatalf("missing artist result = %+v, want notFound with stable empty lists", missingArtist)
	}
	foundArtist := artistDetailResult(&application.ArtistDetail{
		Artist: domain.Artist{ID: "artist"},
		Albums: []domain.Album{{ID: "album"}},
		Tracks: []domain.Track{{ID: "track"}},
	}, urls)
	if foundArtist.Status != LookupFound || foundArtist.Detail.Artist.ID != "artist" || len(foundArtist.Detail.Albums) != 1 {
		t.Fatalf("found artist result = %+v, want found detail", foundArtist)
	}
}
