package application

import "context"

// FolderPicker asks the user to choose a directory (a native dialog). Abstracted
// as a port so the use cases don't depend on the Wails runtime — the backend
// adapter injects a concrete implementation, and tests inject a fake.
type FolderPicker interface {
	Pick(ctx context.Context) (string, error)
}
