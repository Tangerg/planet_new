package backend

import (
	"context"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// wailsFolderPicker implements application.FolderPicker with the native Wails
// directory dialog. It needs the runtime context, captured at startup — the one
// spot the Wails runtime touches the folder-choice use case.
type wailsFolderPicker struct{}

func (p *wailsFolderPicker) Pick(ctx context.Context) (string, error) {
	return wailsruntime.OpenDirectoryDialog(ctx, wailsruntime.OpenDialogOptions{
		Title: "选择音乐文件夹",
	})
}
