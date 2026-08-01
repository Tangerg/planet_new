package application

import (
	"context"
	"errors"
	"fmt"

	"github.com/Tangerg/planet_new/backend/domain"
)

// ErrorCode is the stable application failure taxonomy shared with interface
// adapters. NotFound and Incomplete are normally represented as successful
// result states; keeping them here gives every boundary one common vocabulary.
type ErrorCode string

const (
	ErrorInvalidArgument ErrorCode = "invalidArgument"
	ErrorUnavailable     ErrorCode = "unavailable"
	ErrorNotFound        ErrorCode = "notFound"
	ErrorIncomplete      ErrorCode = "incomplete"
	ErrorCancelled       ErrorCode = "cancelled"
	ErrorFailed          ErrorCode = "failed"
)

// Error preserves an internal cause while exposing only a stable code and
// operation to outer adapters.
type Error struct {
	Code      ErrorCode
	Operation string
	Cause     error
}

func (e *Error) Error() string {
	if e == nil {
		return "<nil>"
	}
	if e.Operation == "" {
		return string(e.Code)
	}
	return fmt.Sprintf("%s: %s", e.Operation, e.Code)
}

func (e *Error) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

func (e *Error) Is(target error) bool {
	want, ok := target.(*Error)
	return ok && e != nil && e.Code == want.Code
}

// Classify normalizes infrastructure and context errors at an application
// boundary without discarding their cause chain.
func Classify(operation string, err error) *Error {
	if err == nil {
		return nil
	}
	var existing *Error
	if errors.As(err, &existing) {
		if existing.Operation != "" || operation == "" {
			return existing
		}
		return &Error{Code: existing.Code, Operation: operation, Cause: existing.Cause}
	}
	code := ErrorFailed
	switch {
	case errors.Is(err, domain.ErrInvalidID):
		code = ErrorInvalidArgument
	case errors.Is(err, context.Canceled), errors.Is(err, context.DeadlineExceeded):
		code = ErrorCancelled
	}
	return &Error{Code: code, Operation: operation, Cause: err}
}

// ErrUnavailable is the stable degraded-backend sentinel.
var ErrUnavailable = &Error{Code: ErrorUnavailable}
