package backend

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/Tangerg/planet_new/backend/application"
)

// wireError is the only error shape allowed to cross the JS bridge. It carries
// the classified code + operation and deliberately drops the internal cause, so
// SQLite text and filesystem paths never leave the process.
//
// The split between its two halves matters. Error() is for humans: Wails uses it
// as the rejection's message, which is what ends up in logs and devtools. The
// machine-readable payload travels separately, through the structured `cause`
// channel — see marshalWireError. Frontend adapters read the payload; nothing
// parses the message.
type wireError struct {
	Code      application.ErrorCode `json:"code"`
	Operation string                `json:"operation"`
}

// The operation is already namespaced (`localLibrary.home`), so it carries the
// subsystem on its own — prefixing it again only stutters in the log line.
func (e *wireError) Error() string {
	return fmt.Sprintf("%s failed (%s)", e.Operation, e.Code)
}

func projectError(operation string, err error) error {
	if err == nil {
		return nil
	}
	classified := application.Classify(operation, err)
	return &wireError{Code: classified.Code, Operation: classified.Operation}
}

// marshalWireError is wired to the bound service's MarshalError hook: whatever
// it returns becomes the `cause` of the promise rejection the frontend sees.
// Returning nil for anything that is not a wireError falls back to Wails'
// default marshalling, so an unclassified failure (a framework-level error, a
// projection we forgot) cannot be mistaken for a stable application code.
func marshalWireError(err error) []byte {
	var wire *wireError
	if !errors.As(err, &wire) {
		return nil
	}
	payload, marshalErr := json.Marshal(wire)
	if marshalErr != nil {
		return nil
	}
	return payload
}
