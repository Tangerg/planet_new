package backend

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"testing"
)

// wirePayload is what the frontend actually receives: the JSON that Wails puts
// on the rejection's `cause`. Asserting on it rather than on Error() keeps these
// tests aimed at the contract instead of at the human-readable message.
func wirePayload(t *testing.T, err error) string {
	t.Helper()
	payload := marshalWireError(err)
	if payload == nil {
		t.Fatalf("error did not marshal to a stable wire payload: %v", err)
	}
	return string(payload)
}

func TestProjectErrorUsesStableWirePayloadWithoutCauseText(t *testing.T) {
	err := projectError("localLibrary.home", errors.New("secret database path"))
	if got := wirePayload(t, err); got != `{"code":"failed","operation":"localLibrary.home"}` {
		t.Fatalf("wire payload = %s", got)
	}
	if strings.Contains(err.Error(), "database") {
		t.Fatal("wire error message leaked infrastructure cause text")
	}
}

func TestProjectErrorClassifiesCancellation(t *testing.T) {
	err := projectError("localLibrary.scan", context.Canceled)
	if got := wirePayload(t, err); got != `{"code":"cancelled","operation":"localLibrary.scan"}` {
		t.Fatalf("wire cancellation payload = %s", got)
	}
}

// Anything the adapter did not classify must fall through to Wails' default
// marshalling rather than being dressed up as a stable application code.
func TestMarshalWireErrorIgnoresUnclassifiedErrors(t *testing.T) {
	if payload := marshalWireError(errors.New("raw failure")); payload != nil {
		t.Fatalf("unclassified error marshalled as a wire payload: %s", payload)
	}
}

func TestMarshalWireErrorUnwrapsAWrappedProjection(t *testing.T) {
	wrapped := fmt.Errorf("call failed: %w", projectError("localLibrary.lyric", context.Canceled))
	if got := wirePayload(t, wrapped); got != `{"code":"cancelled","operation":"localLibrary.lyric"}` {
		t.Fatalf("wrapped wire payload = %s", got)
	}
}
