package backend

import (
	"encoding/json"
	"errors"

	"github.com/Tangerg/planet_new/backend/application"
)

// wireErrorPrefix marks a machine-readable Wails error. The payload deliberately
// excludes the internal cause; frontend adapters parse only code + operation.
const wireErrorPrefix = "PLANET_ERROR:"

type wireErrorPayload struct {
	Code      application.ErrorCode `json:"code"`
	Operation string                `json:"operation"`
}

func projectError(operation string, err error) error {
	if err == nil {
		return nil
	}
	classified := application.Classify(operation, err)
	payload, marshalErr := json.Marshal(wireErrorPayload{
		Code: classified.Code, Operation: classified.Operation,
	})
	if marshalErr != nil {
		return errors.New(wireErrorPrefix + `{"code":"failed","operation":"wire.error"}`)
	}
	return errors.New(wireErrorPrefix + string(payload))
}
