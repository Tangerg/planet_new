package backend

import (
	"context"
	"testing"
)

// A folder pick can also arrive outside a bound call — from a test, or from Go
// code that never crossed the bridge. The dialog must still open then, just
// without a window to hang a sheet from.
func TestCallerWindowIsAbsentOutsideABoundCall(t *testing.T) {
	if window := callerWindow(context.Background()); window != nil {
		t.Fatalf("callerWindow = %v, want nil without a bound call", window)
	}
}
