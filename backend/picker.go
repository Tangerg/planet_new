package backend

import (
	"context"

	wails "github.com/wailsapp/wails/v3/pkg/application"
)

// wailsFolderPicker implements application.FolderPicker with the native Wails
// directory dialog — the one spot the Wails runtime touches the folder-choice
// use case. v3 dialogs are driven from the application singleton rather than a
// captured runtime context, so ctx is unused; the port keeps it because other
// implementations (and the use case above) are context-aware.
type wailsFolderPicker struct{}

func (p *wailsFolderPicker) Pick(_ context.Context) (string, error) {
	dialog := wails.Get().Dialog.OpenFileWithOptions(&wails.OpenFileDialogOptions{
		Title:                "选择音乐文件夹",
		CanChooseDirectories: true,
	})
	// Attaching makes the panel a sheet that drops from the window instead of a
	// detached app-modal box — the presentation v2 gave us for free, and the only
	// one that reads right against a frameless, chrome-less shell.
	if window := wails.Get().Window.Current(); window != nil {
		dialog = dialog.AttachToWindow(window)
	}
	// A cancelled dialog resolves to "" with no error — the use case reads that
	// empty path as "user cancelled".
	return dialog.PromptForSingleSelection()
}
