package backend

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/Tangerg/planet_new/backend/application"
	"github.com/Tangerg/planet_new/backend/domain"
)

func TestLibraryProjectsUnavailableAsStableWireError(t *testing.T) {
	service := application.NewService(application.Config{Clock: wallClock{}})
	library := newLibrary(context.Background(), service, mediaURLs{})

	_, err := library.Home(context.Background())
	if err == nil {
		t.Fatal("Home unexpectedly succeeded with unavailable infrastructure")
	}
	want := `{"code":"unavailable","operation":"localLibrary.home"}`
	if got := wirePayload(t, err); got != want {
		t.Fatalf("Home wire payload = %s, want %s", got, want)
	}
	if strings.Contains(err.Error(), "sqlite") {
		t.Fatal("Home wire error leaked infrastructure details")
	}
}

func TestLibraryRejectsMalformedEntityIDsAtTheWireBoundary(t *testing.T) {
	service := application.NewService(application.Config{Clock: wallClock{}})
	library := newLibrary(context.Background(), service, mediaURLs{})
	ctx := context.Background()
	tests := []struct {
		name      string
		operation string
		call      func() error
	}{
		{name: "album", operation: "localLibrary.albumDetail", call: func() error {
			_, err := library.AlbumDetail(ctx, "album")
			return err
		}},
		{name: "artist", operation: "localLibrary.artistDetail", call: func() error {
			_, err := library.ArtistDetail(ctx, "artist")
			return err
		}},
		{name: "tracks", operation: "localLibrary.tracks", call: func() error {
			_, err := library.Tracks(ctx, []string{"0123456789abcdef", "broken"})
			return err
		}},
		{name: "lyric", operation: "localLibrary.lyric", call: func() error {
			_, err := library.Lyric(ctx, "track")
			return err
		}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := test.call()
			if err == nil {
				t.Fatal("malformed id was accepted at the wire boundary")
			}
			want := `{"code":"invalidArgument","operation":"` + test.operation + `"}`
			if got := wirePayload(t, err); got != want {
				t.Fatalf("wire validation payload = %s, want %s", got, want)
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

// A bound call has two ways to end: the frontend abandoning it (Wails cancels
// the per-call context) and the application shutting down. callScope must honour
// both, because Wails roots per-call contexts away from the application's and
// only cancels a window's calls after the shutdown hooks have already run.
func TestCallScopeEndsWithEitherTheCallOrTheApplication(t *testing.T) {
	awaitDone := func(t *testing.T, ctx context.Context, what string) {
		t.Helper()
		select {
		case <-ctx.Done():
		case <-time.After(2 * time.Second):
			t.Fatalf("call scope outlived %s", what)
		}
	}

	t.Run("application shutdown", func(t *testing.T) {
		lifetime, stopWork := context.WithCancel(context.Background())
		library := newLibrary(lifetime, application.NewService(application.Config{Clock: wallClock{}}), mediaURLs{})

		scoped, done := library.callScope(context.Background())
		defer done()

		stopWork()
		awaitDone(t, scoped, "the application lifetime")
	})

	t.Run("abandoned call", func(t *testing.T) {
		library := newLibrary(context.Background(), application.NewService(application.Config{Clock: wallClock{}}), mediaURLs{})

		call, abandon := context.WithCancel(context.Background())
		scoped, done := library.callScope(call)
		defer done()

		abandon()
		awaitDone(t, scoped, "its own call")
	})
}
