package application

import (
	"context"
	"errors"
	"testing"
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
