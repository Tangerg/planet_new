package backend

import (
	"context"
	"errors"
	"strings"
	"testing"
)

func TestProjectErrorUsesStableWirePayloadWithoutCauseText(t *testing.T) {
	err := projectError("localLibrary.home", errors.New("secret database path"))
	if got := err.Error(); got != `PLANET_ERROR:{"code":"failed","operation":"localLibrary.home"}` {
		t.Fatalf("wire error = %q", got)
	}
	if strings.Contains(err.Error(), "database") {
		t.Fatal("wire error leaked infrastructure cause text")
	}
}

func TestProjectErrorClassifiesCancellation(t *testing.T) {
	err := projectError("localLibrary.scan", context.Canceled)
	if got := err.Error(); got != `PLANET_ERROR:{"code":"cancelled","operation":"localLibrary.scan"}` {
		t.Fatalf("wire cancellation = %q", got)
	}
}
