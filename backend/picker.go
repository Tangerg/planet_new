package backend

import (
	"context"

	wails "github.com/wailsapp/wails/v3/pkg/application"
)

// wailsFolderPicker implements application.FolderPicker with the native Wails
// directory dialog — the one spot the Wails runtime touches the folder-choice
// use case.
type wailsFolderPicker struct{}

func (p *wailsFolderPicker) Pick(ctx context.Context) (string, error) {
	dialog := wails.Get().Dialog.OpenFileWithOptions(&wails.OpenFileDialogOptions{
		Title:                "选择音乐文件夹",
		CanChooseDirectories: true,
	})
	// Attaching presents the panel as a sheet dropping from that window rather
	// than a detached app-modal box — the presentation v2 gave us for free, and
	// the only one that reads right against a frameless, chrome-less shell.
	if window := callerWindow(ctx); window != nil {
		dialog = dialog.AttachToWindow(window)
	}
	// A cancelled dialog resolves to "" with no error — the use case reads that
	// empty path as "user cancelled".
	return dialog.PromptForSingleSelection()
}

// callerWindow returns the window whose frontend made the bound call, which
// Wails carries on the call's context.
//
// This is deliberately not `Window.Current()`. That answers with the key window,
// which is the wrong window as soon as there is more than one, and no window at
// all whenever the app is not frontmost. The context names the actual caller.
// It is absent outside a bound call (a direct Go invocation, a test), so the
// dialog has to stay usable without one.
func callerWindow(ctx context.Context) wails.Window {
	window, _ := ctx.Value(wails.WindowKey).(wails.Window)
	return window
}
