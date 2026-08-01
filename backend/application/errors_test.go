package application

import (
	"context"
	"errors"
	"testing"

	"github.com/Tangerg/planet_new/backend/domain"
)

func TestClassifyPreservesCauseAndStableCode(t *testing.T) {
	cause := errors.New("sqlite details must remain internal")
	got := Classify("library.home", cause)
	if got.Code != ErrorFailed || got.Operation != "library.home" || !errors.Is(got, cause) {
		t.Fatalf("Classify = %+v, want failed operation with preserved cause", got)
	}
	if got.Error() != "library.home: failed" {
		t.Fatalf("public error = %q, want no infrastructure cause text", got.Error())
	}
}

func TestClassifyNormalizesCancellationAndUnavailable(t *testing.T) {
	if got := Classify("library.scan", context.Canceled); got.Code != ErrorCancelled {
		t.Fatalf("cancel code = %q, want %q", got.Code, ErrorCancelled)
	}
	if got := Classify("library.home", ErrUnavailable); got.Code != ErrorUnavailable {
		t.Fatalf("unavailable code = %q, want %q", got.Code, ErrorUnavailable)
	}
	if !errors.Is(Classify("library.home", ErrUnavailable), ErrUnavailable) {
		t.Fatal("classified unavailable error must retain sentinel identity")
	}
}

func TestClassifyMapsDomainValidationWithoutLosingItsCause(t *testing.T) {
	_, cause := domain.ParseTrackID("not-an-id")
	got := Classify("library.track", cause)
	if got.Code != ErrorInvalidArgument || got.Operation != "library.track" {
		t.Fatalf("validation classification = %+v, want invalidArgument", got)
	}
	if !errors.Is(got, domain.ErrInvalidID) {
		t.Fatal("classified validation error must retain the domain cause")
	}
}
